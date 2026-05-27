"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FooterDisclaimer } from "@/components/footer-disclaimer"
import { setSessionMode, storeProfile } from "@/lib/app-session"
import { useToast } from "@/components/toast-provider"
import type { VtopApiResponse } from "@/lib/vtop/types"

export default function LoginPage() {
  const router = useRouter()
  const { notify } = useToast()
  const [loading, setLoading] = React.useState<"login" | "demo" | null>(null)
  const [status, setStatus] = React.useState<string>("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [challenge, setChallenge] = React.useState<{ challengeId: string; captchaImage: string | null }>()
  const [challengeLoading, setChallengeLoading] = React.useState(true)
  const [takingLong, setTakingLong] = React.useState(false)
  const [challengeError, setChallengeError] = React.useState<string>()
  const isSubmitting = React.useRef(false)

  const loadChallenge = React.useCallback(async () => {
    setChallengeLoading(true)
    setTakingLong(false)
    setChallengeError(undefined)
    setChallenge(undefined) // Immediately invalidate old challenge
    
    const longTimer = window.setTimeout(() => setTakingLong(true), 10_000)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 25_000)
    try {
      const response = await fetch("/api/vtop/challenge", { cache: "no-store", signal: controller.signal })
      const payload = (await response.json()) as
        | { ok: true; challenge: { challengeId: string; captchaImage: string | null } }
        | { ok: false; message: string }
      if (payload.ok) {
        setChallenge(payload.challenge)
      } else {
        setChallengeError(payload.message)
        notify({ title: "VTOP CAPTCHA unavailable", description: payload.message, tone: "warning" })
      }
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError"
      const message = timedOut
        ? "VTOP Chennai took too long to return a CAPTCHA. Try again in a few seconds."
        : "UniBoard could not prepare the official VTOP Chennai login challenge."
      setChallengeError(message)
      notify({
        title: "VTOP CAPTCHA unavailable",
        description: message,
        tone: "warning",
      })
    } finally {
      window.clearTimeout(timeout)
      window.clearTimeout(longTimer)
      setChallengeLoading(false)
      setTakingLong(false)
    }
  }, [notify])

  React.useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
       if (mounted) void loadChallenge()
    }, 0)
    return () => {
       mounted = false
       window.clearTimeout(timer)
    }
  }, [loadChallenge])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading !== null || isSubmitting.current) return
    
    isSubmitting.current = true

    const form = new FormData(event.currentTarget)
    const username = String(form.get("username") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const captcha = String(form.get("captcha") ?? "").trim()

    if (!username || !password || (challenge?.captchaImage && !captcha) || !challenge?.challengeId) {
      notify({
        title: "VTOP details needed",
        description: challenge?.captchaImage 
          ? "Enter your VTOP Chennai credentials and the CAPTCHA shown by VTOP."
          : "Enter your VTOP Chennai username and password.",
        tone: "warning",
      })
      isSubmitting.current = false
      return
    }

    setLoading("login")
    setStatus("Connecting to VTOP...")
    
    // Simulate progress updates for better UX transparency
    const statusInterval = window.setInterval(() => {
      setStatus(prev => {
        if (prev === "Connecting to VTOP...") return "Authenticating credentials..."
        if (prev === "Authenticating credentials...") return "Navigating VTOP portal..."
        if (prev === "Navigating VTOP portal...") return "Resolving conflicts..."
        if (prev === "Resolving conflicts...") return "Fetching academic records..."
        return prev
      })
    }, 2500)

    try {
      const response = await fetch("/api/vtop/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember, captcha, challengeId: challenge.challengeId }),
      })
      const payload = (await response.json()) as VtopApiResponse
      
      window.clearInterval(statusInterval)

      if (!payload.ok) {
        notify({
          title: payload.code === "CAPTCHA_REQUIRED" || payload.code === "CAPTCHA_INVALID" ? "VTOP CAPTCHA rejected" : "VTOP connection failed",
          description: payload.message,
          tone: "warning",
        })
        
        // Always load a new challenge on failure because the backend deletes the challenge upon processing
        void loadChallenge()
        
        setLoading(null)
        setStatus("")
        return
      }
      
      setStatus("Syncing academic data...")
      if (payload.data?.profile) {
        storeProfile({
          fullName: payload.data.profile.fullName || username,
          vtopUsername: username,
          registrationNumber: payload.data.profile.registrationNumber,
          branch: payload.data.profile.branch || payload.data.profile.program,
          semester: payload.data.profile.semester,
          profilePicture: payload.data.profile.profilePhoto,
        })
      } else {
        storeProfile({
          fullName: username,
          vtopUsername: username,
          registrationNumber: "",
          branch: "VTOP Chennai",
          semester: "",
        })
      }

      setSessionMode("student")
      notify({
        title: "VTOP Chennai connected",
        description: "Fetched your latest academic data into UniBoard.",
        tone: "success",
      })
      router.push("/")
    } catch {
      notify({
        title: "Network issue",
        description: "UniBoard could not reach the local VTOP connector. Try again in a moment.",
        tone: "warning",
      })
      setLoading(null)
    } finally {
      isSubmitting.current = false
    }
  }

  async function tryDemo() {
    setLoading("demo")
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    storeProfile({
      fullName: "Aarav Raman",
      vtopUsername: "demo.vit",
      registrationNumber: "24BCE1001",
      branch: "B.Tech Computer Science",
      semester: "4",
    })
    setSessionMode("demo")
    notify({
      title: "Demo workspace opened",
      description: "Explore sample attendance, GPA, fees, timetable, and analytics.",
      tone: "success",
    })
    router.push("/")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.05] paper-noise" />
      <div className="absolute inset-0 opacity-[0.04] grid-pattern" />
      <main className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-[36vh] flex-col justify-between border-b border-border/50 p-6 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-2xl font-bold tracking-tight">UniBoard</p>
              <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">Personal Academic OS</p>
            </div>
          </div>

          <div className="max-w-xl py-14 lg:py-0">
            <p className="mb-4 inline-flex items-center gap-2 border border-border bg-background/60 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Built for students who want clarity, not clutter.
            </p>
            <h1 className="text-balance font-serif text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
              Your calm command center for VIT academics.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                  Connect securely to VTOP Chennai to track attendance, GPA, timetable, fees, and academic signals in one quiet workspace.
            </p>
          </div>

          <FooterDisclaimer />
        </section>

        <section className="flex items-center justify-center p-6 lg:p-10">
          <Card className="w-full max-w-md rounded-none border-border bg-card/70 paper-shadow e-ink-refresh">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="font-serif text-2xl font-semibold">Sign in</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  VTOP Chennai only. Your credentials are only used to securely fetch your academic data.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP Username</label>
                  <Input required name="username" placeholder="VTOP Chennai username" className="rounded-none bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP Password</label>
                  <div className="relative">
                    <Input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="rounded-none bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {challenge && !challenge.captchaImage ? (
                    <div className="flex items-center gap-2 rounded-none border border-border bg-muted/30 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground animate-in fade-in slide-in-from-top-1">
                      <ShieldCheck className="h-3 w-3" />
                      VTOP CAPTCHA not required for this session
                    </div>
                  ) : (
                    <div className={challenge && !challenge.captchaImage ? "hidden" : "space-y-2"}>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP CAPTCHA</label>
                        <button
                          type="button"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          onClick={loadChallenge}
                          disabled={challengeLoading || loading !== null}
                        >
                          Refresh
                        </button>
                      </div>
                      <div className="border border-border bg-background p-2">
                        {challengeLoading ? (
                          <div className="flex h-14 flex-col items-center justify-center gap-1">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fetching VTOP CAPTCHA...</div>
                            {takingLong && <div className="text-[9px] text-muted-foreground/60 animate-pulse">Taking longer than usual...</div>}
                          </div>
                        ) : challenge?.captchaImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={challenge.captchaImage} alt="VTOP CAPTCHA" className="mx-auto h-14 max-w-full object-contain" />
                        ) : challengeError ? (
                          <div className="flex min-h-16 flex-col items-center justify-center gap-2 px-3 py-2 text-center">
                            <p className="text-xs text-muted-foreground">{challengeError}</p>
                            <button
                              type="button"
                              className="text-[10px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline"
                              onClick={loadChallenge}
                            >
                              Try fetching again
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-14 items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
                            CAPTCHA unavailable
                          </div>
                        )}
                      </div>
                      <Input
                        required={!!(challenge && challenge.captchaImage)}
                        name="captcha"
                        placeholder="Enter CAPTCHA"
                        maxLength={6}
                        className="rounded-none bg-background uppercase"
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-3.5 w-3.5 accent-foreground"
                  />
                  Remember encrypted VTOP session on this device
                </label>

                <Button type="submit" className="h-10 w-full rounded-none gap-2 flex-col items-center justify-center py-6" disabled={loading !== null || challengeLoading}>
                  <div className="flex items-center gap-2">
                    {loading === "login" ? status : "Connect VTOP Chennai"}
                    {loading !== "login" ? <ArrowRight className="h-4 w-4" /> : null}
                  </div>
                  {loading === "login" && (
                    <div className="text-[9px] uppercase tracking-[0.2em] opacity-70 animate-pulse">
                      Processing Background Scraper...
                    </div>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-none gap-2"
                disabled={loading !== null}
                onClick={tryDemo}
              >
                <Sparkles className="h-4 w-4" />
                {loading === "demo" ? "Preparing demo..." : "Try Demo"}
              </Button>

              <div className="mt-6 space-y-3 border-t border-border/50 pt-6">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  UniBoard opens a secure browser session for VTOP Chennai and keeps credentials encrypted. Users log in at their own discretion.
                </p>
                <p className="text-xs text-muted-foreground">
                  First time here?{" "}
                  <Link href="/onboarding" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Set up UniBoard
                  </Link>
                </p>
                <div className="flex gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                  <Link href="/terms" className="hover:text-foreground">Terms</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
