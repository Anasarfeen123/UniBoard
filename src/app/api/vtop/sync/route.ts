import { NextResponse } from "next/server"
import { toVtopError } from "@/lib/vtop/errors"
import { syncVtopWithCookies, syncVtopWithCredentials } from "@/lib/vtop/scraper"
import { readVtopSession, toConnectionState, writeVtopSession } from "@/lib/vtop/session-store"
import type { StoredVtopSession } from "@/lib/vtop/session-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await readVtopSession()
  return NextResponse.json({
    ok: true,
    message: session?.browserCookies?.length ? "VTOP Chennai session is connected." : "VTOP Chennai is not connected.",
    state: toConnectionState(session),
  })
}

export async function POST() {
  const session = await readVtopSession()
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        code: "SESSION_EXPIRED",
        message: "Reconnect VTOP Chennai to start syncing academic data.",
        recoverable: true,
        state: toConnectionState(null),
      },
      { status: 401 },
    )
  }

  try {
    const result = session.password
      ? await syncVtopWithCredentials({ username: session.username, password: session.password })
      : await syncVtopWithCookies(session.browserCookies)

    const nextSession: StoredVtopSession = {
      ...session,
      browserCookies: result.browserCookies,
      lastSyncedAt: result.data.syncedAt,
      sessionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    }

    await writeVtopSession(nextSession)

    return NextResponse.json({
      ok: true,
      message: "Fetched the latest academic data from VTOP Chennai.",
      state: toConnectionState(nextSession),
      data: result.data,
    })
  } catch (error) {
    const vtopError = toVtopError(error)
    return NextResponse.json(
      {
        ok: false,
        code: vtopError.code,
        message: vtopError.message,
        recoverable: vtopError.recoverable,
        state: toConnectionState(session),
      },
      { status: vtopError.code === "SESSION_EXPIRED" ? 401 : 409 },
    )
  }
}
