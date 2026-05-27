import { NextResponse } from "next/server"
import { toVtopError } from "@/lib/vtop/errors"
import { createVtopLoginChallenge } from "@/lib/vtop/scraper"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const challenge = await Promise.race([
      createVtopLoginChallenge(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("VTOP Chennai took too long to return a CAPTCHA. Try again in a few seconds.")),
          20_000,
        ),
      ),
    ])
    return NextResponse.json({
      ok: true,
      message: challenge.captchaImage ? "VTOP Chennai CAPTCHA ready." : "VTOP Chennai session ready (no CAPTCHA).",
      challenge,
    })
  } catch (error) {
    const vtopError = toVtopError(error)
    return NextResponse.json(
      {
        ok: false,
        code: vtopError.code,
        message: vtopError.message,
        recoverable: vtopError.recoverable,
      },
      { status: 503 },
    )
  }
}
