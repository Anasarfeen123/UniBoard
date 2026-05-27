import { NextResponse } from "next/server"
import { toVtopError } from "@/lib/vtop/errors"
import { syncVtopWithChallenge, syncVtopWithCredentials } from "@/lib/vtop/scraper"
import { toConnectionState, writeVtopSession } from "@/lib/vtop/session-store"
import type { StoredVtopSession } from "@/lib/vtop/session-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string
      password?: string
      remember?: boolean
      captcha?: string
      challengeId?: string
    }

    const username = body.username?.trim()
    const password = body.password ?? ""
    const remember = Boolean(body.remember)

    if (!username || !password) {
      return NextResponse.json(
        {
          ok: false,
          code: "WRONG_CREDENTIALS",
          message: "Enter your VTOP Chennai username and password.",
          recoverable: true,
        },
        { status: 400 },
      )
    }

    const result =
      body.challengeId
        ? await syncVtopWithChallenge({
            username,
            password,
            challengeId: body.challengeId,
            captcha: body.captcha ?? "",
          })
        : await syncVtopWithCredentials({ username, password })
    const { data, browserCookies } = result
    const session: StoredVtopSession = {
      username,
      password: remember ? password : undefined,
      remember,
      browserCookies,
      lastSyncedAt: data.syncedAt,
      sessionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    }

    await writeVtopSession(session)

    return NextResponse.json({
      ok: true,
      message: "VTOP Chennai connected and academic data synced.",
      state: toConnectionState(session),
      data,
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
      { status: vtopError.recoverable ? 409 : 503 },
    )
  }
}
