import { cookies } from "next/headers"
import type { Cookie } from "playwright"
import { VTOP_CHENNAI_ORIGIN, type VtopConnectionState } from "./types"

const SESSION_COOKIE = "uniboard.vtop.session"
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7

export type StoredVtopSession = {
  username: string
  password?: string
  remember: boolean
  browserCookies: Cookie[]
  selectedSemesterId?: string
  lastSyncedAt?: string
  sessionExpiresAt?: string
}

function getSecretMaterial() {
  return process.env.UNIBOARD_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "uniboard-local-dev-secret-change-me"
}

async function getCryptoKey() {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(getSecretMaterial()))
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"])
}

function toBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url")
}

function fromBase64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"))
}

async function encryptJson(value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getCryptoKey()
  const encoded = new TextEncoder().encode(JSON.stringify(value))
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded))
  return `${toBase64Url(iv)}.${toBase64Url(encrypted)}`
}

async function decryptJson<T>(value: string): Promise<T | null> {
  const [ivValue, payloadValue] = value.split(".")
  if (!ivValue || !payloadValue) return null

  try {
    const key = await getCryptoKey()
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(ivValue) },
      key,
      fromBase64Url(payloadValue),
    )
    return JSON.parse(new TextDecoder().decode(decrypted)) as T
  } catch {
    return null
  }
}

export async function readVtopSession() {
  const jar = await cookies()
  const value = jar.get(SESSION_COOKIE)?.value
  if (!value) return null
  return decryptJson<StoredVtopSession>(value)
}

export async function writeVtopSession(session: StoredVtopSession) {
  const jar = await cookies()
  const payload = await encryptJson(session)
  jar.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.remember ? ONE_WEEK_SECONDS : undefined,
  })
}

export async function clearVtopSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export function toConnectionState(session: StoredVtopSession | null): VtopConnectionState {
  return {
    connected: Boolean(session?.browserCookies?.length),
    username: session?.username,
    lastSyncedAt: session?.lastSyncedAt,
    sessionExpiresAt: session?.sessionExpiresAt,
    campus: "VTOP Chennai",
    source: VTOP_CHENNAI_ORIGIN,
  }
}
