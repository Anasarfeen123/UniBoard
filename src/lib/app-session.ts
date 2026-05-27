"use client"

export type WorkspaceMode = "student" | "demo"

export type SetupProfile = {
  fullName: string
  vtopUsername: string
  registrationNumber: string
  branch: string
  semester: string
  profilePicture?: string
}

const SESSION_KEY = "uniboard.session"
const PROFILE_KEY = "uniboard.profile"
const SPLASH_KEY = "uniboard.splashSeen"

export function getSessionMode(): WorkspaceMode | null {
  if (typeof window === "undefined") return null
  const value = window.localStorage.getItem(SESSION_KEY)
  return value === "demo" || value === "student" ? value : null
}

export function setSessionMode(mode: WorkspaceMode) {
  window.localStorage.setItem(SESSION_KEY, mode)
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export function getStoredProfile(): SetupProfile | null {
  if (typeof window === "undefined") return null
  const value = window.localStorage.getItem(PROFILE_KEY)
  if (!value) return null
  try {
    return JSON.parse(value) as SetupProfile
  } catch {
    return null
  }
}

export function storeProfile(profile: SetupProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function hasSeenSplash() {
  if (typeof window === "undefined") return false
  return window.sessionStorage.getItem(SPLASH_KEY) === "true"
}

export function markSplashSeen() {
  window.sessionStorage.setItem(SPLASH_KEY, "true")
}
