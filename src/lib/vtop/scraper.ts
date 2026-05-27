import { VtopScraperError } from "./errors"
import {
  VTOP_CHENNAI_ORIGIN,
  type VtopAcademicHistoryRecord,
  type VtopAttendanceRecord,
  type VtopFeeRecord,
  type VtopGpaRecord,
  type VtopMarkRecord,
  type VtopProfile,
  type VtopSyncedData,
  type VtopTimetableEntry,
  type VtopExamEntry,
} from "./types"

type Playwright = typeof import("playwright")
type BrowserContext = Awaited<ReturnType<Playwright["chromium"]["launch"]>> extends infer Browser
  ? Browser extends { newContext: (...args: never[]) => Promise<infer Context> }
    ? Context
    : never
  : never
type Page = BrowserContext extends { newPage: () => Promise<infer P> } ? P : never
type BrowserCookie = import("playwright").Cookie
type Browser = Awaited<ReturnType<Playwright["chromium"]["launch"]>>
type LoginChallenge = {
  browser: Browser
  context: BrowserContext
  page: Page
  expiresAt: number
}

export type VtopLoginInput = {
  username: string
  password: string
}

const browserLaunchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
}

let sharedBrowser: Browser | null = null
let sharedBrowserLaunchPromise: Promise<Browser> | null = null

async function getSharedBrowser(playwright: Playwright): Promise<Browser> {
  if (sharedBrowser) return sharedBrowser
  if (sharedBrowserLaunchPromise) return sharedBrowserLaunchPromise

  sharedBrowserLaunchPromise = playwright.chromium.launch(browserLaunchOptions).then((browser) => {
    sharedBrowser = browser
    browser.on("disconnected", () => {
      sharedBrowser = null
      sharedBrowserLaunchPromise = null
    })
    return browser
  })

  return sharedBrowserLaunchPromise
}

const globalVtopState = globalThis as typeof globalThis & {
  __uniboardVtopLoginChallenges?: Map<string, LoginChallenge>
}
const loginChallenges = globalVtopState.__uniboardVtopLoginChallenges ?? new Map<string, LoginChallenge>()
globalVtopState.__uniboardVtopLoginChallenges = loginChallenges

async function loadPlaywright(): Promise<Playwright> {
  try {
    return await import("playwright")
  } catch {
    throw new VtopScraperError(
      "CONNECTOR_UNAVAILABLE",
      "The VTOP connector is not installed on this deployment. Install Playwright and its Chromium browser.",
      false,
    )
  }
}

function clean(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? ""
}

function parseNumber(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  return match ? Number(match[0]) : undefined
}

function classifyLoginFailure(text: string) {
  const t = text.toLowerCase()
  
  if (/maintenance|under maintenance|scheduled maintenance|site is down|not available/i.test(t) && t.includes("vtop")) {
    throw new VtopScraperError("VTOP_DOWN", "VTOP Chennai is currently under maintenance. Please try again later.")
  }
  
  if (/database connection error|connection pool|database error|could not connect to database/i.test(t)) {
    throw new VtopScraperError("VTOP_DOWN", "VTOP Chennai database is currently unreachable. This is usually a temporary portal issue.")
  }

  if (
    t.includes("invalid captcha") || 
    t.includes("wrong captcha") || 
    t.includes("incorrect captcha") || 
    t.includes("captcha invalid") || 
    t.includes("captcha incorrect") ||
    t.includes("invalid verification code") ||
    t.includes("verification code mismatch") ||
    t.includes("invalid code") ||
    t.includes("enter captcha") ||
    t.includes("verification code") && t.includes("invalid")
  ) {
    throw new VtopScraperError("CAPTCHA_INVALID", "VTOP Chennai rejected the CAPTCHA. Refresh it and enter the new code exactly.")
  }
  if (
    t.includes("invalid username") || 
    t.includes("invalid password") || 
    t.includes("username/password") || 
    t.includes("invalid login") || 
    t.includes("authentication failed") || 
    t.includes("bad credentials") || 
    t.includes("user does not exist") ||
    t.includes("wrong password") ||
    t.includes("user id does not exist")
  ) {
    throw new VtopScraperError("WRONG_CREDENTIALS", "VTOP Chennai rejected the username or password.")
  }
  if (t.includes("csrf") || t.includes("session timed out") || t.includes("session expired") || t.includes("timed out")) {
    throw new VtopScraperError("SESSION_EXPIRED", "The VTOP login session expired. Refresh the CAPTCHA and try again.")
  }
  if (t.includes("another session is active") || t.includes("active session")) {
    return
  }
}

async function tableRows(page: Page, labels: string[]) {
  const needles = labels.map((item) => item.toLowerCase())
  const frames = page.frames()
  
  for (const frame of frames) {
    try {
      // Check for session timeout inside the frame
      const bodyText = await frame.locator("body").textContent({ timeout: 1000 }).catch(() => "")
      if (/session timed out|login again|logged out/i.test(bodyText || "")) {
        console.warn(`[VTOP-Scrape] Session timeout detected in frame: ${frame.url()}`)
        continue
      }

      const rows = await frame.evaluate((needles) => {
        const tables = Array.from(document.querySelectorAll("table"));
        const allMatchingRows: string[][] = [];

        for (const table of tables) {
          const tableText = table.textContent?.toLowerCase() || "";
          const containerText = table.parentElement?.textContent?.toLowerCase() || "";
          
          if (!needles.some((needle) => tableText.includes(needle) || containerText.includes(needle))) continue;
          
          const trs = Array.from(table.querySelectorAll("tr"));
          for (const row of trs) {
            const cells = Array.from(row.querySelectorAll("th, td"))
              .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "");
            
            // Skip rows that look like headers (contain all needles or match common header patterns)
            const isHeader = cells.some(c => /sl\.no|course code|subject|component|percentage|status|attended/i.test(c));
            if (isHeader && cells.length > 2) continue;

            if (cells.length > 1 && cells.some(c => c.length > 0)) {
              allMatchingRows.push(cells);
            }
          }
        }
        return allMatchingRows;
      }, needles).catch(() => [] as string[][])
      
      if (rows.length > 0) {
        console.log(`[VTOP-Scrape] Extracted ${rows.length} data rows from frame: ${frame.url()}`);
        return rows;
      }
    } catch (e) {
      // Continue to next frame
    }
  }
  
  return []
}

async function definitionValue(page: Page, labels: string[]) {
  const needles = labels.map((label) => label.toLowerCase())
  const frames = page.frames()
  
  for (const frame of frames) {
    try {
      const bodyText = await frame.locator("body").textContent({ timeout: 500 }).catch(() => "")
      if (/session timed out|login again|logged out/i.test(bodyText || "")) continue;

      const value = await frame.evaluate((needles) => {
        // 1. Try finding in table cells (very common for profiles)
        const cells = Array.from(document.querySelectorAll("td, th"));
        for (let i = 0; i < cells.length; i++) {
          const text = cells[i].textContent?.replace(/\s+/g, " ").trim().toLowerCase().replace(/[:*]/g, "").trim() || "";
          
          // Check for exact or partial match
          if (needles.some(n => text === n || (text.length > 3 && n.includes(text)))) {
            // Check if value is in the SAME cell (e.g. "Name: John Doe")
            const fullText = cells[i].textContent?.trim() || "";
            const parts = fullText.split(/[:\-]/);
            if (parts.length > 1 && parts[1].trim().length > 0) return parts[1].trim();

            // Check if value is in the NEXT cell
            const next = cells[i + 1]?.textContent?.trim();
            if (next && next.toLowerCase() !== text) return next;
          }
        }

        // 2. Fallback to generic node search
        const nodes = Array.from(document.querySelectorAll("label, span, div, p, b, strong"));
        for (let index = 0; index < nodes.length; index += 1) {
          const text = nodes[index]?.textContent?.replace(/\s+/g, " ").trim().toLowerCase().replace(/[:*]/g, "").trim() || "";
          if (needles.some(n => text === n)) {
            const sibling = nodes[index + 1]?.textContent?.replace(/\s+/g, " ").trim();
            if (sibling && sibling.toLowerCase() !== text) return sibling;
          }
        }
        return ""
      }, needles).catch(() => "")
      
      if (value) return value
    } catch (e) {}
  }
  
  return ""
}

async function clickLikely(page: Page, terms: string[]) {
  console.log(`[VTOP-Scrape] Attempting to navigate to: ${terms[0]}`)
  
  // Mapping of common search terms to known VTOP Chennai endpoints for direct fallback
  const directEndpoints: Record<string, string> = {
    profile: "studentsRecord/StudentProfileAllView",
    attendance: "processAttendance/StudentAttendance",
    marks: "examinations/StudentMarkView",
    gpa: "examinations/StudentGradeHistory",
    history: "examinations/StudentGradeHistory",
    timetable: "timetable/StudentTimeTableChn",
    exams: "examinations/StudExamSchedule",
    fees: "accounts/getFeesIntimation",
  }

  const frames = page.frames()

  // First, try the highly reliable data-url approach for VTOP's specific AJAX routing across all frames
  for (const term of terms) {
    for (const frame of frames) {
      try {
        const links = await frame.locator(`[data-url*="${term}" i]`).all()
        for (const link of links) {
            const dataUrl = await link.getAttribute('data-url')
            if (dataUrl) {
                console.log(`[VTOP-Scrape] Found AJAX target in frame: ${dataUrl}`)
                // Execute VTOP's native routing function in the context of the frame where it was found
                const result = await frame.evaluate((url) => {
                    const id = (document.getElementById("authorizedIDX") as HTMLInputElement)?.value || 
                             (window.parent.document.getElementById("authorizedIDX") as HTMLInputElement)?.value || "";
                    const csrfToken = (document.querySelector('input[name="_csrf"]') as HTMLInputElement)?.value || 
                                    (window.parent.document.querySelector('input[name="_csrf"]') as HTMLInputElement)?.value || "";
                    const dataText = `verifyMenu=true&authorizedID=${id}&_csrf=${csrfToken}&nocache=${new Date().getTime()}`;
                    
                    try {
                      const win = window as any;
                      if (typeof win.ajaxB5Call === 'function') {
                          win.ajaxB5Call(url, dataText);
                          return { success: true, method: 'ajaxB5Call' };
                      } else if (typeof win.ajaxCall === 'function') {
                          win.ajaxCall(url, dataText);
                          return { success: true, method: 'ajaxCall' };
                      } else if (typeof win.parent.ajaxB5Call === 'function') {
                          win.parent.ajaxB5Call(url, dataText);
                          return { success: true, method: 'parent.ajaxB5Call' };
                      } else {
                          return { success: false, error: "No VTOP ajax routing function found" };
                      }
                    } catch (e: any) {
                      return { success: false, error: e.toString() }
                    }
                }, dataUrl)
                
                if (result.success) {
                   console.log(`[VTOP-Scrape] Successfully executed native routing via ${result.method}`)
                   await page.waitForTimeout(2500) // Wait for AJAX to populate DOM
                   return true
                }
            }
        }
      } catch (e) {}
    }
  }

  // Second, try direct endpoint call if we have a mapping for the term
  for (const term of terms) {
    const endpoint = directEndpoints[term.toLowerCase()]
    if (endpoint) {
       console.log(`[VTOP-Scrape] Attempting direct fallback to endpoint: ${endpoint}`)
       // Try evaluating in the main frame and parent frames
       for (const frame of frames) {
         try {
           const result = await frame.evaluate((url) => {
              const id = (document.getElementById("authorizedIDX") as HTMLInputElement)?.value || 
                       (window.parent.document.getElementById("authorizedIDX") as HTMLInputElement)?.value || "";
              const csrfToken = (document.querySelector('input[name="_csrf"]') as HTMLInputElement)?.value || 
                              (window.parent.document.querySelector('input[name="_csrf"]') as HTMLInputElement)?.value || "";
              const dataText = `verifyMenu=true&authorizedID=${id}&_csrf=${csrfToken}&nocache=${new Date().getTime()}`;
              
              try {
                const win = window as any;
                if (typeof win.ajaxB5Call === 'function') {
                    win.ajaxB5Call(url, dataText);
                    return { success: true };
                } else if (typeof win.ajaxCall === 'function') {
                    win.ajaxCall(url, dataText);
                    return { success: true };
                }
              } catch (e) {}
              return { success: false };
           }, endpoint)

           if (result.success) {
              console.log(`[VTOP-Scrape] Successfully executed direct routing to ${endpoint}`)
              await page.waitForTimeout(2500)
              return true
           }
         } catch (e) {}
       }
    }
  }

  // Fallback to text clicking if data-url routing fails
  for (const term of terms) {
    for (const frame of frames) {
      const link = frame.getByText(new RegExp(term, "i")).first()
      try {
        if (await link.count() > 0) {
          console.log(`[VTOP-Scrape] Fallback: Clicking text '${term}' in frame...`)
          await link.click({ timeout: 2500 })
          await page.waitForTimeout(1500)
          return true
        }
      } catch (e) {}
    }
  }
  
  console.error(`[VTOP-Scrape] Could not navigate to: ${terms.join(', ')}`)
  return false
}

async function openStudentLogin(page: Page) {
  console.log("[VTOP] Navigating to VTOP Chennai...")
  try {
    // Try navigating to the student login processor directly if possible, 
    // or just load the main page with a faster timeout.
    await page.goto(VTOP_CHENNAI_ORIGIN, { waitUntil: "domcontentloaded", timeout: 15_000 })
  } catch (error) {
    console.warn("[VTOP] Initial navigation timed out, retrying once...")
    // Retry once on failure
    await page.waitForTimeout(500)
    await page.goto(VTOP_CHENNAI_ORIGIN, { waitUntil: "domcontentloaded", timeout: 15_000 })
  }

  // Quickly check if we are on the splash page with the "Student" button
  const studentBtn = page.locator("#stdForm a, form#stdForm").first()
  if (await studentBtn.count() > 0) {
    console.log("[VTOP] Splash page detected. Clicking 'Student' login...")
    await studentBtn.click({ timeout: 5000 }).catch(async () => {
      await page.evaluate(() => {
        const form = document.querySelector<HTMLFormElement>("#stdForm")
        form?.submit()
      })
    })
  }
  
  // Wait for the captcha block OR the username field to appear instead of waiting for the whole network to be idle
  console.log("[VTOP] Waiting for login form elements...")
  await Promise.race([
    page.locator("#captchaBlock, #captchaStr, .captcha-image").first().waitFor({ state: "attached", timeout: 15_000 }),
    page.locator('input[name*="username" i], [id*="username" i], input[name*="user" i], input[id*="uname" i]').first().waitFor({ state: "attached", timeout: 15_000 })
  ]).catch(() => console.warn("[VTOP] Wait for form elements timed out."))
}

async function login(page: Page, input: VtopLoginInput) {
  await openStudentLogin(page)

  const bodyText = clean(await page.locator("body").textContent({ timeout: 10_000 }).catch(() => ""))
  if (/captcha|verification code/i.test(bodyText) || (await page.locator("#captchaBlock img, #captchaStr, [name='captchaStr']").count() > 0)) {
    console.log("[VTOP] CAPTCHA detected on login form.")
    throw new VtopScraperError(
      "CAPTCHA_REQUIRED",
      "VTOP Chennai is asking for CAPTCHA verification on the official login form. UniBoard cannot bypass it; sign in on VTOP once or reconnect when VTOP allows a captcha-free session.",
    )
  }

  const username = page.locator('input[name*="username" i], [id*="username" i], input[name*="user" i], input[id*="uname" i]').first()
  const password = page.locator('input[type="password"], [id*="password" i], [name*="password" i]').first()
  
  console.log(`[VTOP] Entering credentials for user: ${input.username}`)
  await username.fill(input.username, { timeout: 15_000 })
  await password.fill(input.password, { timeout: 15_000 })

  const submit = page.locator('button[type="submit"], input[type="submit"], #submitBtn, button:has-text("Login"), input[value*="Login" i]').first()
  
  console.log("[VTOP] Submitting login form...")
  // Use the native VTOP submission function if available, otherwise fallback to click
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined),
    page.evaluate(() => {
      if (typeof (window as any).callBuiltValidation === 'function') {
        (window as any).callBuiltValidation();
      } else {
        const btn = document.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"], #submitBtn');
        btn?.click();
      }
    }).catch(() => undefined)
  ])
  
  // Poll for up to 10 seconds to see if we navigate or an error appears
  console.log("[VTOP] Polling for login success or errors...")
  let afterLoginText = ""
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000)
    
    // Explicitly check if we are stuck on the login error page
    if (page.url().includes("/login/error")) {
       afterLoginText = await getAllPageText(page)
       classifyLoginFailure(afterLoginText)
       // If no specific error was classified but we are on /error, it's still a failure
       console.error("[VTOP] Login failed: Redirected to /vtop/login/error")
       throw new VtopScraperError("WRONG_CREDENTIALS", "VTOP Chennai login failed. Please check your credentials.")
    }

    // VTOP uses AJAX for the dashboard load. Check for definitive DOM elements indicating success.
    // Use a frame-aware check for the authorizedID which is the most reliable marker.
    let foundAuthMarker = false
    const frames = page.frames()
    for (const frame of frames) {
       if (await frame.locator("#authorizedIDX").count() > 0) {
          foundAuthMarker = true
          break
       }
    }
    
    if (foundAuthMarker || page.url().includes("/vtop/content") || page.url().includes("/vtop/home")) {
       console.log("[VTOP] Login confirmed via session markers.")
       afterLoginText = "dashboard" // Force success state
       break
    }

    afterLoginText = await getAllPageText(page)
    classifyLoginFailure(afterLoginText)

    // Handle "Another session is active" button if it appears
    const otherSessionBtn = page.locator('button:has-text("Logout other session"), button:has-text("Sign out from other session"), #btnOtherSession, .btn-primary:has-text("Logout")').first()
    if (await otherSessionBtn.count() > 0) {
      console.log("[VTOP] Session conflict detected. Clicking 'Logout other session'...")
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load", timeout: 45_000 }).catch(() => undefined),
        otherSessionBtn.click({ timeout: 15_000 }).catch(() => undefined),
      ])
      continue
    }

    if (/student|profile|attendance|timetable|course|semester|logout|sign out|menu|dashboard|academic|grade|welcome|home|main|faculty|registration/i.test(afterLoginText)) {
      console.log("[VTOP] Login confirmed via text identification.")
      break
    }
  }

  if (/captcha|verification code/i.test(afterLoginText) && !/logout|sign out|menu|dashboard|academic|grade|welcome|home|main|faculty|registration/i.test(afterLoginText)) {
    console.warn("[VTOP] Login failed: CAPTCHA required after submit.")
    classifyLoginFailure(afterLoginText)
    throw new VtopScraperError("CAPTCHA_REQUIRED", "VTOP Chennai needs CAPTCHA verification before UniBoard can continue.")
  }
  
  if (!/student|profile|attendance|timetable|course|semester|logout|sign out|menu|dashboard|academic|grade|welcome|home|main|faculty|registration/i.test(afterLoginText)) {
    if (await page.locator('input[name*="username" i]').first().count() > 0) {
      console.error("[VTOP] Login failed: Still on login page after submission.")
      throw new VtopScraperError("WRONG_CREDENTIALS", "VTOP Chennai login failed. Please check your username and password.")
    }
    console.error("[VTOP] Login failed: Could not identify workspace.")
    throw new VtopScraperError("SCRAPE_FAILED", "UniBoard signed in but could not identify the VTOP student workspace.")
  }
}


import sharp from "sharp"
import { createWorker } from "tesseract.js"

async function solveCaptcha(base64Image: string): Promise<string> {
  try {
    console.log("[OCR] Preprocessing CAPTCHA image...")
    const base64Data = base64Image.split(",")[1] || base64Image
    const buffer = Buffer.from(base64Data, "base64")
    
    // Preprocess image for better OCR: grayscale, threshold, and resize
    const processedBuffer = await sharp(buffer)
      .grayscale()
      .resize(400) // Upscale for better recognition
      .linear(1.5, -0.2) // Increase contrast
      .threshold(120) // Binarize to remove noise
      .toBuffer()

    console.log("[OCR] Attempting to solve CAPTCHA...")
    // Since tesseract.js is now a serverExternalPackage, we can use the default initialization
    // which is more reliable in a Node.js environment.
    const worker = await createWorker("eng", 1, {
      logger: m => {
        if (m.status === "recognizing" && Math.round(m.progress * 100) % 25 === 0) {
           console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
    
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      tessedit_pageseg_mode: "7" as any, // Treat the image as a single text line
    })
    
    const { data: { text } } = await worker.recognize(processedBuffer)
    await worker.terminate()
    
    // VTOP captchas are strictly 6 characters long and alphanumeric
    const solution = text.replace(/[^A-Z0-9]/g, "").trim().toUpperCase()
    
    if (solution.length !== 6) {
       console.warn(`[OCR] Extracted CAPTCHA is invalid length (${solution.length}): ${solution}`)
       return "" // Return empty to signal failure and trigger a retry/error
    }
    
    console.log(`[OCR] CAPTCHA solved: ${solution}`)
    return solution
  } catch (error) {
    console.error("[OCR] Captcha OCR failed:", error)
    return ""
  }
}


async function getAllPageText(page: Page) {
  try {
    const frames = page.frames()
    const texts = await Promise.all(
      frames.map(f => f.locator("body").textContent({ timeout: 1000 }).catch(() => ""))
    )
    return clean(texts.join(" "))
  } catch (e) {
    // If frames crash (e.g. execution context destroyed during redirect), fallback safely
    return clean(await page.locator("body").textContent({ timeout: 1000 }).catch(() => ""))
  }
}


function cleanupExpiredChallenges() {
  const now = Date.now()
  for (const [id, challenge] of loginChallenges.entries()) {
    if (challenge.expiresAt > now) continue
    void challenge.context.close().catch(() => undefined)
    loginChallenges.delete(id)
  }
}

export async function createVtopLoginChallenge() {
  cleanupExpiredChallenges()
  const playwright = await loadPlaywright()
  const browser = await getSharedBrowser(playwright)
  const context = await browser.newContext({ baseURL: VTOP_CHENNAI_ORIGIN, ignoreHTTPSErrors: true })
  const page = await context.newPage()

  try {
    await openStudentLogin(page)
    
    // Check if we are already logged in or if captcha is not present
    const bodyText = clean(await page.locator("body").textContent({ timeout: 5000 }).catch(() => ""))
    const hasCaptcha = /captcha|verification code/i.test(bodyText) || (await page.locator("#captchaBlock img, #captchaStr, [name='captchaStr']").count() > 0)
    const hasLoginFields = (await page.locator('input[name*="username" i], [id*="username" i], input[name*="user" i], input[id*="uname" i]').first().count()) > 0

    if (!hasCaptcha && hasLoginFields) {
      const challengeId = crypto.randomUUID()
      loginChallenges.set(challengeId, {
        browser,
        context,
        page,
        expiresAt: Date.now() + 1000 * 60 * 12,
      })
      return { challengeId, captchaImage: null }
    }

    if (!hasCaptcha && !hasLoginFields) {
      throw new VtopScraperError("CONNECTOR_UNAVAILABLE", "VTOP Chennai login page did not load correctly. Try again.")
    }

    const captcha = page.locator("#captchaBlock img").first()
    await captcha.waitFor({ timeout: 10_000 })
    
    // Extract captcha as base64 using canvas for high performance
    let captchaImage = await captcha.evaluate(async (img: HTMLImageElement) => {
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return img.currentSrc || img.src;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL("image/png");
    });

    if (!captchaImage || captchaImage.startsWith("http")) {
      // Fallback to screenshot if canvas extraction fails or returns a URL
      const captchaBuffer = await captcha.screenshot()
      captchaImage = `data:image/png;base64,${captchaBuffer.toString("base64")}`
    }

    const challengeId = crypto.randomUUID()
    loginChallenges.set(challengeId, {
      browser,
      context,
      page,
      expiresAt: Date.now() + 1000 * 60 * 12,
    })

    return { challengeId, captchaImage }
  } catch (error) {
    await context.close().catch(() => undefined)
    throw error
  }
}

export async function syncVtopWithChallenge(input: VtopLoginInput & { challengeId: string; captcha: string }) {
  console.log(`[VTOP] Resuming session with challenge: ${input.challengeId}`)
  cleanupExpiredChallenges()
  const challenge = loginChallenges.get(input.challengeId)
  if (!challenge) {
    console.warn(`[VTOP] Challenge not found or expired: ${input.challengeId}`)
    throw new VtopScraperError(
      "SESSION_EXPIRED",
      "UniBoard lost the VTOP CAPTCHA session before login could finish. Refresh the CAPTCHA and submit again without reloading the page.",
    )
  }

  loginChallenges.delete(input.challengeId)

  try {
    const page = challenge.page
    
    // Use robust selectors consistent with the login() function
    const usernameField = page.locator('input[name*="username" i], [id*="username" i], input[name*="user" i], input[id*="uname" i]').first()
    const passwordField = page.locator('input[type="password"], [id*="password" i], [name*="password" i]').first()
    const captchaField = page.locator('input[name*="captcha" i]:not([type="hidden"]), input[id*="captcha" i]:not([type="hidden"]), input[name*="verify" i]:not([type="hidden"])').first()
    const submitButton = page.locator('button[type="submit"], input[type="submit"], #submitBtn, button:has-text("Login"), input[value*="Login" i]').first()

    // Ensure we are still on the right page and haven't hit a timeout redirect before even starting
    if (page.url().includes("/error")) {
        console.warn("[VTOP] Session hit an error page before submission. Aborting.")
        throw new VtopScraperError("SESSION_EXPIRED", "VTOP session expired before submission. Refresh the CAPTCHA and try again.")
    }

    console.log(`[VTOP] Entering credentials for user: ${input.username}`)
    
    // Verify the form hasn't been lost or reloaded
    const hasForm = await page.locator('form#stdForm, form#vtopLoginForm, form').first().count() > 0
    if (!hasForm) {
       console.warn("[VTOP] Login form lost before submission. Page may have reloaded.")
       throw new VtopScraperError("SESSION_EXPIRED", "The VTOP page unexpectedly reloaded. Refresh the CAPTCHA and try again.")
    }

    // Try to ensure CSRF token is present in the form if expected
    const csrfToken = await page.locator('input[name="_csrf"]').first().getAttribute("value").catch(() => null)
    if (csrfToken) {
       console.log(`[VTOP] CSRF token verified: ${csrfToken.substring(0, 8)}...`)
    } else {
       console.log(`[VTOP] No CSRF token found on form.`)
    }

    await usernameField.fill(input.username, { timeout: 15_000 })
    await passwordField.fill(input.password, { timeout: 15_000 })
    
    if (input.captcha && (await captchaField.count()) > 0) {
      console.log("[VTOP] Filling CAPTCHA...")
      await captchaField.fill(input.captcha.trim().toUpperCase(), { timeout: 15_000 })
    }
    
    console.log("[VTOP] Submitting login form...")
    // Use the native VTOP submission function if available, otherwise fallback to click
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined),
      page.evaluate(() => {
        if (typeof (window as any).callBuiltValidation === 'function') {
          (window as any).callBuiltValidation();
        } else {
          const btn = document.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"], #submitBtn');
          btn?.click();
        }
      }).catch(() => undefined)
    ])
    
    console.log(`[VTOP] Post-submit URL: ${page.url()}`)
    
    // Poll for up to 10 seconds to see if we navigate or an error appears
    console.log("[VTOP] Polling for login success or errors...")
    let text = ""
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000)
      
      // Explicitly check if we are stuck on the login error page
      if (page.url().includes("/login/error")) {
          text = await getAllPageText(page)
          classifyLoginFailure(text)
          console.error("[VTOP] Login failed: Redirected to /vtop/login/error")
          throw new VtopScraperError("WRONG_CREDENTIALS", "VTOP Chennai login failed. Please check your credentials.")
      }

      // VTOP uses AJAX for the dashboard load. Check for definitive DOM elements indicating success.
      let foundAuthMarker = false
      const frames = page.frames()
      for (const frame of frames) {
         if (await frame.locator("#authorizedIDX").count() > 0) {
            foundAuthMarker = true
            break
         }
      }
      
      if (foundAuthMarker || page.url().includes("/vtop/content") || page.url().includes("/vtop/home")) {
         console.log("[VTOP] Login confirmed via session markers.")
         text = "dashboard" // Force success state
         break
      }

      try {
        text = await getAllPageText(page)
      } catch (e) {
        console.log(`[VTOP] Polling step ${i+1}. Navigation in progress, ignoring read error.`)
        continue
      }
      console.log(`[VTOP] Polling step ${i+1}. URL: ${page.url()}`)
      classifyLoginFailure(text)

      // Handle "Another session is active" button if it appears
      const otherSessionBtn = page.locator('button:has-text("Logout other session"), button:has-text("Sign out from other session"), #btnOtherSession, .btn-primary:has-text("Logout"), button:has-text("Logout")').first()
      if (await otherSessionBtn.count() > 0 && !/logout|sign out/i.test(text)) {
        console.log("[VTOP] Session conflict detected. Resolving forcefully...")
        await Promise.all([
          page.waitForNavigation({ waitUntil: "load", timeout: 45_000 }).catch(() => undefined),
          otherSessionBtn.click({ timeout: 15_000, force: true }).catch(() => undefined),
        ])
        continue
      }

      if (/student|profile|attendance|timetable|course|semester|logout|sign out|menu|dashboard|academic|grade|welcome|home|main|faculty|registration/i.test(text)) {
        console.log("[VTOP] Login confirmed via text identification.")
        break
      }
    }
    
    if (/captcha|enter captcha/i.test(text) && !/student home|attendance|profile|semester|logout|sign out|menu|dashboard|academic|grade|welcome|home|main|faculty|registration/i.test(text)) {
      // One last check for errors before failing
      classifyLoginFailure(text)
      throw new VtopScraperError("CAPTCHA_INVALID", "VTOP Chennai returned to the CAPTCHA form. Refresh it and try again.")
    }

    if (!/student|profile|attendance|timetable|course|semester|logout|sign out|menu|dashboard|academic|grade|welcome|home|main|faculty|registration/i.test(text)) {
      // If we are still on the login page but no error was classified, check if username field is still there
      const hasUsername = await page.locator('input[name*="username" i]').first().count() > 0
      const hasLoginButton = await page.locator('button:has-text("Login"), input[value*="Login" i]').first().count() > 0
      
      if (hasUsername || hasLoginButton || text.toLowerCase().includes("login")) {
        console.warn("[VTOP] Login failed: Still on login page. URL:", page.url(), "Text snippet:", text.slice(0, 300))
        throw new VtopScraperError("WRONG_CREDENTIALS", "VTOP Chennai login failed. Please check your username and password.")
      }
      
      console.error("[VTOP] Scrape failed. URL:", page.url(), "Final page text snippet:", text.slice(0, 1000))
      throw new VtopScraperError("SCRAPE_FAILED", "UniBoard signed in but could not identify the VTOP student workspace.")
    }

    console.log("[VTOP] Login verified. Proceeding to scrape data...")
    const data = await scrapeAll(page)
    const browserCookies = await challenge.context.cookies()
    return { data, browserCookies }
  } catch (error) {
    throw error
  }
}

async function scrapeProfile(page: Page): Promise<VtopProfile | undefined> {
  // Quick scan of the dashboard header for name and registration number as a fallback
  let dashboardName = ""
  let dashboardRegNo = ""
  try {
    const frames = page.frames()
    let headerText = ""
    for (const frame of frames) {
       const text = await frame.locator("#vtopHeader, .vtopHeader, .studentName").first().textContent({ timeout: 1000 }).catch(() => "")
       if (text) {
          headerText = text
          break
       }
    }
    
    if (headerText) {
      dashboardName = clean(headerText.match(/welcome\s+([^(\n-]+)/i)?.[1])
      dashboardRegNo = clean(headerText.match(/\d{2}[A-Z]{3}\d{4}/i)?.[0])
    }
  } catch (e) {}

  // Prioritize "Your Credentials" which has a cleaner table layout, then fallback to the main profile
  await clickLikely(page, ["viewStudentCredentials", "StudentProfileAllView", "profile", "student profile"])

  const fullName =
    clean(await definitionValue(page, ["name", "student name", "full name"])) ||
    clean(await page.locator("h1,h2,h3,.studentName,.profile-name").first().textContent({ timeout: 2000 }).catch(() => "")) ||
    dashboardName

  const registrationNumber = 
    clean(await definitionValue(page, ["register number", "registration number", "reg no", "reg. no"])) ||
    dashboardRegNo

  const program = clean(await definitionValue(page, ["program", "programme", "degree"]))
  const branch = clean(await definitionValue(page, ["branch", "course", "specialization"]))
  const school = clean(await definitionValue(page, ["school", "school / centre", "centre"]))
  const department = clean(await definitionValue(page, ["department", "dept"]))
  const semester = clean(await definitionValue(page, ["semester", "current semester"]))
  const email = clean(await definitionValue(page, ["email", "email id", "vit email"]))
  const academicStatus = clean(await definitionValue(page, ["status", "academic status"])) || "Active"
  const profilePhoto = await page
    .locator('img[src*="photo" i], img[src*="profile" i], img[src*="image" i]')
    .first()
    .evaluate((img: HTMLImageElement) => img.currentSrc || img.src)
    .catch(() => undefined)

  if (!fullName && !registrationNumber) return undefined

  return {
    fullName,
    registrationNumber,
    program,
    branch,
    school,
    department,
    semester,
    email,
    academicStatus,
    profilePhoto,
  }
}

async function scrapeAttendance(page: Page): Promise<VtopAttendanceRecord[]> {
  await clickLikely(page, ["StudentAttendance", "attendance", "student attendance"])
  const rows = await tableRows(page, ["attendance", "attended", "percentage", "subject", "slot", "faculty"])
  return rows
    .map((row) => {
      const percentageStr = row.find((cell) => cell.includes("%") || /^\d+(\.\d+)?$/.test(cell)) ?? ""
      const percentage = parseNumber(percentageStr) ?? 0
      
      // Try to find attended and total classes.
      // Often in VTOP Chennai they are formatted as "Attended / Total" in one cell or separate columns.
      let attended = 0
      let total = 0
      
      const ratioCell = row.find((cell) => cell.includes("/") && /\d/.test(cell))
      if (ratioCell) {
         const parts = ratioCell.split("/").map(p => parseNumber(p))
         attended = parts[0] ?? 0
         total = parts[1] ?? 0
      } else {
         const numbers = row.map((cell) => parseNumber(cell)).filter((value): value is number => typeof value === "number" && value <= 500)
         // Heuristic: Attended and Total are often the two numbers appearing before the percentage
         attended = numbers.at(-3) ?? 0
         total = numbers.at(-2) ?? 0
      }

      return {
        courseCode: row.find((cell) => /^[A-Z]{2,}\d+[A-Z]?/i.test(cell)) ?? "",
        courseTitle: row.find((cell) => /[A-Za-z]{4,}/.test(cell) && !/attendance|total|attended|course type|slot|faculty|regular/i.test(cell)) ?? "Course",
        slot: row.find((cell) => /^[A-Z]\d[+-]?(\s*\+\s*[A-Z]\d[+-]?)*$/i.test(cell) || /^[A-Z][+-]?$/i.test(cell)),
        faculty: row.find((cell) => /[A-Z]{3,}\s+[A-Z\s]+/.test(cell) && cell.length > 5 && !/course|slot|attendance|regular/i.test(cell)),
        attended,
        total,
        percentage,
        status: percentage >= 75 ? "On Track" : percentage > 0 ? "Needs Attention" : "Unknown",
      } satisfies VtopAttendanceRecord
    })
    .filter((item) => item.courseCode || item.courseTitle !== "Course")
}

async function scrapeMarks(page: Page): Promise<VtopMarkRecord[]> {
  await clickLikely(page, ["StudentMarkView", "marks", "grade", "course page"])
  
  let allRows: string[][] = []
  
  // VTOP marks page requires selecting a semester from a dropdown first
  try {
    const frames = page.frames()
    for (const frame of frames) {
      const select = frame.locator('select').first()
      if (await select.count() > 0) {
        // Get all semester option values (excluding the default placeholder if it has no value)
        const options = await select.locator('option').all()
        const values = []
        for (const option of options) {
           const val = await option.getAttribute('value')
           const text = await option.textContent() || ""
           if (val && val.trim() !== '' && !/choose|select/i.test(text)) {
               values.push(val)
           }
        }
        
        console.log(`[VTOP-Scrape] Found ${values.length} semesters in marks dropdown.`)
        
        // Limit to the top 4 most recent semesters to prevent timeout.
        // Older final grades are already captured holistically in Academic History.
        const recentSemesters = values.slice(0, 4)
        console.log(`[VTOP-Scrape] Processing top ${recentSemesters.length} semesters to avoid timeout...`)
        
        for (const val of recentSemesters) {
           console.log(`[VTOP-Scrape] Selecting semester: ${val}`)
           await select.selectOption(val)
           // Wait for the AJAX call that populates the table based on selection.
           // VTOP Chennai usually takes 1-2 seconds to refresh the table.
           await page.waitForTimeout(2000)
           
           const rows = await tableRows(page, ["marks", "assessment", "grade", "course", "subject", "score", "component"])
           if (rows.length > 0) {
              console.log(`[VTOP-Scrape] Scraped ${rows.length} mark rows for semester ${val}`)
              allRows = allRows.concat(rows)
           }
        }
        
        // If we found and processed a dropdown, break early so we don't try other frames unnecessarily
        if (values.length > 0) break
      }
    }
  } catch (e) {
     console.warn("[VTOP-Scrape] Failed to interact with marks semester dropdown:", e)
  }
  
  // Fallback: If no dropdown was found or it failed, try scraping the page directly
  // (In case VTOP reverts to a flat structure or pre-loads the current semester)
  if (allRows.length === 0) {
      allRows = await tableRows(page, ["marks", "assessment", "grade", "course", "subject", "score", "component"])
  }

  return allRows
    .map((row) => {
      const scoreCell = row.find((cell) => /\d+\s*\/\s*\d+/.test(cell))
      let scored = parseNumber(row.find((cell) => /\d+(\.\d+)?/.test(cell)) ?? "")
      let max = parseNumber(row.find((cell) => /max|maximum|\/\s*\d+/i.test(cell)) ?? "")
      
      if (scoreCell) {
         const parts = scoreCell.split("/").map(p => parseNumber(p))
         scored = parts[0]
         max = parts[1]
      }

      return {
        courseCode: row.find((cell) => /^[A-Z]{2,}\d+/i.test(cell)) ?? "",
        courseTitle: row.find((cell) => /[A-Za-z]{4,}/.test(cell) && !/marks|grade|assessment|scored|max/i.test(cell)) ?? "Course",
        assessment: row.find((cell) => /cat|fat|quiz|lab|assignment|assessment|final|project|theory/i.test(cell)) ?? "Assessment",
        scored,
        max,
        grade: row.find((cell) => /^[ABSCDENF][+-]?$/i.test(cell)),
      }
    })
    .filter((item) => item.courseCode || item.courseTitle !== "Course")
}

async function scrapeGpa(page: Page): Promise<VtopGpaRecord[]> {
  await clickLikely(page, ["StudentGradeHistory", "gpa", "cgpa", "grade history", "academic history"])
  const rows = await tableRows(page, ["gpa", "cgpa", "credits", "semester", "effective gpa", "curriculum"])
  return rows
    .map((row) => ({
      semester: row.find((cell) => /semester|winter|fall|summer|\d/i.test(cell)) ?? "",
      gpa: parseNumber(row.find((cell) => /gpa/i.test(cell)) ?? ""),
      cgpa: parseNumber(row.find((cell) => /cgpa/i.test(cell)) ?? ""),
      credits: parseNumber(row.find((cell) => /credit/i.test(cell)) ?? ""),
    }))
    .filter((item) => item.semester || item.gpa || item.cgpa)
}

async function scrapeTimetable(page: Page): Promise<VtopTimetableEntry[]> {
  await clickLikely(page, ["StudentTimeTableChn", "StudentTimeTable", "timetable", "time table", "class schedule"])
  const rows = await tableRows(page, ["slot", "room", "day", "time", "subject", "course title"])
  return rows
    .map((row) => ({
      day: row.find((cell) => /mon|tue|wed|thu|fri|sat|sun/i.test(cell)) ?? "",
      startTime: row.find((cell) => /\d{1,2}:\d{2}/.test(cell)) ?? "",
      courseCode: row.find((cell) => /^[A-Z]{2,}\d+/i.test(cell)) ?? "",
      courseTitle: row.find((cell) => /[A-Za-z]{4,}/.test(cell) && !/slot|room|day/i.test(cell)) ?? "Class",
      room: row.find((cell) => /[A-Z]{2,}\s*\d{2,}/i.test(cell)),
      slot: row.find((cell) => /^[A-Z]\d?[+-]?$/i.test(cell)),
    }))
    .filter((item) => item.day || item.courseCode)
}

async function scrapeExams(page: Page): Promise<VtopExamEntry[]> {
  await clickLikely(page, ["StudExamSchedule", "exam schedule", "examination", "exam"])
  const rows = await tableRows(page, ["exam", "venue", "date", "course", "subject", "session", "reporting"])
  return rows
    .map((row) => ({
      courseCode: row.find((cell) => /^[A-Z]{2,}\d+/i.test(cell)) ?? "",
      courseTitle: row.find((cell) => /[A-Za-z]{4,}/.test(cell) && !/exam|venue|date/i.test(cell)) ?? "Course",
      examType: row.find((cell) => /cat|fat|lab|final|mid/i.test(cell)) ?? "Exam",
      date: row.find((cell) => /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(cell)),
      time: row.find((cell) => /\d{1,2}:\d{2}/.test(cell)),
      venue: row.find((cell) => /hall|block|room|[A-Z]{2,}\s*\d{2,}/i.test(cell)),
    }))
    .filter((item) => item.courseCode || item.date)
}

async function scrapeFees(page: Page): Promise<VtopFeeRecord[]> {
  await clickLikely(page, ["getFeesIntimation", "Payments", "fee", "financial"])
  const rows = await tableRows(page, ["fee", "paid", "balance", "amount", "transaction", "payment"])
  return rows
    .map((row) => {
      const amount = parseNumber(row.find((cell) => /₹|rs|inr|amount/i.test(cell)) ?? row.find((cell) => /\d/.test(cell)) ?? "")
      const statusText = row.find((cell) => /paid|pending|overdue|due/i.test(cell)) ?? ""
      return {
        label: row.find((cell) => /[A-Za-z]{4,}/.test(cell) && !/paid|pending|amount/i.test(cell)) ?? "Fee",
        amount,
        paid: /paid/i.test(statusText) ? amount : undefined,
        due: /pending|overdue|due/i.test(statusText) ? amount : undefined,
        dueDate: row.find((cell) => /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(cell)),
        status: /paid/i.test(statusText)
          ? "Paid"
          : /overdue/i.test(statusText)
            ? "Overdue"
            : /pending|due/i.test(statusText)
              ? "Pending"
              : "Unknown",
      } satisfies VtopFeeRecord
    })
    .filter((item) => item.label !== "Fee" || item.amount)
}

async function scrapeHistory(page: Page): Promise<VtopAcademicHistoryRecord[]> {
  await clickLikely(page, ["StudentGradeHistory", "academic history", "transcript"])
  const rows = await tableRows(page, ["semester", "grade", "credits", "result", "subject", "course", "effective"])
  return rows
    .map((row) => ({
      semester: row.find((cell) => /semester|winter|fall|summer|\d/i.test(cell)) ?? "",
      courseCode: row.find((cell) => /^[A-Z]{2,}\d+/i.test(cell)),
      courseTitle: row.find((cell) => /[A-Za-z]{4,}/.test(cell) && !/semester|grade|result/i.test(cell)),
      credits: parseNumber(row.find((cell) => /credit|\d/.test(cell)) ?? ""),
      grade: row.find((cell) => /^[ABSCDENF][+-]?$/i.test(cell)),
      result: row.find((cell) => /pass|fail|completed/i.test(cell)),
    }))
    .filter((item) => item.semester || item.courseCode)
}

async function scrapeAll(page: Page): Promise<VtopSyncedData> {
  const syncedAt = new Date().toISOString()
  const unavailableAreas: VtopSyncedData["unavailableAreas"] = []

  // Try to grab CGPA directly from the dashboard before we navigate away
  let dashboardCgpa: number | undefined
  let dashboardCredits: number | undefined
  try {
    const dashboardText = await getAllPageText(page)
    // Looking for patterns like "CGPA : 8.9" or "Credits Earned : 120"
    const cgpaMatch = dashboardText.match(/(?:CGPA|Cumulative\s*Grade\s*Point\s*Average)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i)
    if (cgpaMatch) {
       const val = parseFloat(cgpaMatch[1])
       if (val <= 10) dashboardCgpa = val
    }
    
    const creditsMatch = dashboardText.match(/(?:Credits\s*Earned|Total\s*Credits|Credits\s*Registered|Total\s*Credit)\s*[:\-]?\s*(\d+)/i)
    if (creditsMatch) dashboardCredits = parseInt(creditsMatch[1], 10)
    
    console.log(`[VTOP-Scrape] Dashboard quick-scan: CGPA=${dashboardCgpa}, Credits=${dashboardCredits}`)
  } catch (e) {
    console.log("[VTOP-Scrape] Failed to scan dashboard for CGPA")
  }

  async function attempt<T>(area: VtopSyncedData["unavailableAreas"][number], task: () => Promise<T>, fallback: T) {
    try {
      const result = await task()
      if (Array.isArray(result) && result.length === 0) unavailableAreas.push(area)
      if (!Array.isArray(result) && !result) unavailableAreas.push(area)
      return result
    } catch {
      unavailableAreas.push(area)
      return fallback
    }
  }

  const profile = await attempt("profile", () => scrapeProfile(page), undefined)
  const attendance = await attempt("attendance", () => scrapeAttendance(page), [])
  const marks = await attempt("marks", () => scrapeMarks(page), [])
  
  // Try deep dive first, fallback to dashboard scan
  let gpa = await attempt("gpa", () => scrapeGpa(page), [])
  if (gpa.length === 0 && dashboardCgpa) {
      gpa = [{ semester: "Current", gpa: dashboardCgpa, cgpa: dashboardCgpa, credits: dashboardCredits }]
      // Remove from unavailable if we salvaged it from the dashboard
      const index = unavailableAreas.indexOf("gpa");
      if (index > -1) unavailableAreas.splice(index, 1);
  }
  
  const timetable = await attempt("timetable", () => scrapeTimetable(page), [])
  const exams = await attempt("exams", () => scrapeExams(page), [])
  const fees = await attempt("fees", () => scrapeFees(page), [])
  const academicHistory = await attempt("history", () => scrapeHistory(page), [])

  return {
    campus: "VTOP Chennai",
    source: VTOP_CHENNAI_ORIGIN,
    syncedAt,
    profile,
    attendance,
    marks,
    gpa,
    timetable,
    exams,
    fees,
    academicHistory,
    unavailableAreas,
  }
}

export async function syncVtopWithCredentials(input: VtopLoginInput) {
  const playwright = await loadPlaywright()
  const browser = await getSharedBrowser(playwright)
  const context = await browser.newContext({ baseURL: VTOP_CHENNAI_ORIGIN, ignoreHTTPSErrors: true })

  try {
    const page = await context.newPage()
    await login(page, input)
    const data = await scrapeAll(page)
    const browserCookies = await context.cookies()
    return { data, browserCookies }
  } finally {
    await context.close()
  }
}

export async function syncVtopWithCookies(browserCookies: BrowserCookie[]) {
  if (!browserCookies.length) {
    throw new VtopScraperError("SESSION_EXPIRED", "Your VTOP session has expired. Reconnect with your VTOP Chennai credentials.")
  }

  const playwright = await loadPlaywright()
  const browser = await getSharedBrowser(playwright)
  const context = await browser.newContext({ baseURL: VTOP_CHENNAI_ORIGIN, ignoreHTTPSErrors: true })

  try {
    await context.addCookies(browserCookies)
    const page = await context.newPage()
    await page.goto(`${VTOP_CHENNAI_ORIGIN}/vtop/content`, { waitUntil: "domcontentloaded", timeout: 20_000 })
    await page.waitForTimeout(2000)
    
    let isDashboard = false
    const frames = page.frames()
    for (const frame of frames) {
       if (await frame.locator('#authorizedIDX, .VITEmblem, #vtopHeader').first().count() > 0) {
          isDashboard = true
          break
       }
    }

    if (!isDashboard) {
      throw new VtopScraperError("SESSION_EXPIRED", "Your VTOP session has expired. Reconnect to continue syncing.")
    }
    
    console.log("[VTOP] Cookie sync verified. Proceeding to scrape data...")
    const data = await scrapeAll(page)
    const refreshedCookies = await context.cookies()
    return { data, browserCookies: refreshedCookies }
  } finally {
    await context.close()
  }
}
