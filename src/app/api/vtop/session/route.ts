import { NextResponse } from "next/server"
import { clearVtopSession, readVtopSession, toConnectionState } from "@/lib/vtop/session-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await readVtopSession()
  return NextResponse.json({
    ok: true,
    message: session ? "VTOP Chennai session found." : "No VTOP Chennai session is stored.",
    state: toConnectionState(session),
  })
}

export async function DELETE() {
  await clearVtopSession()
  return NextResponse.json({
    ok: true,
    message: "VTOP Chennai session cleared.",
    state: toConnectionState(null),
  })
}
