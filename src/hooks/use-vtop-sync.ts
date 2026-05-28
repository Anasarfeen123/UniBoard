"use client"

import * as React from "react"
import type { VtopApiResponse, VtopConnectionState, VtopSyncedData } from "@/lib/vtop/types"

const DATA_KEY = "uniboard.vtop.data"
const PREFS_KEY = "uniboard.vtop.syncPrefs"
const DATA_EVENT = "uniboard:vtop-data-changed"

const defaultState: VtopConnectionState = {
  connected: false,
  campus: "VTOP Chennai",
  source: "https://vtopcc.vit.ac.in",
}

export type SyncPreference = {
  attendance: boolean
  marks: boolean
  timetable: boolean
  exams: boolean
  fees: boolean
  history: boolean
}

export const defaultSyncPrefs: SyncPreference = {
  attendance: true,
  marks: true,
  timetable: true,
  exams: true,
  fees: true,
  history: true,
}

function readStoredData() {
  if (typeof window === "undefined") return undefined
  const value = window.localStorage.getItem(DATA_KEY)
  if (!value) return undefined
  try {
    return JSON.parse(value) as VtopSyncedData
  } catch {
    return undefined
  }
}

export function writeStoredVtopData(data: VtopSyncedData) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DATA_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event(DATA_EVENT))
}

function readPrefs() {
  if (typeof window === "undefined") return defaultSyncPrefs
  const value = window.localStorage.getItem(PREFS_KEY)
  if (!value) return defaultSyncPrefs
  try {
    return { ...defaultSyncPrefs, ...(JSON.parse(value) as Partial<SyncPreference>) }
  } catch {
    return defaultSyncPrefs
  }
}

export function writeVtopPrefs(prefs: SyncPreference) {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function clearStoredVtopData() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DATA_KEY)
  window.dispatchEvent(new Event(DATA_EVENT))
}

export function useVtopSync(options?: { autoRefreshMs?: number }) {
  const [state, setState] = React.useState<VtopConnectionState>(defaultState)
  const [data, setData] = React.useState<VtopSyncedData | undefined>(() => readStoredData())
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [message, setMessage] = React.useState("Checking VTOP Chennai connection...")
  const [error, setError] = React.useState<VtopApiResponse & { ok: false }>()
  const [prefs, setPrefsState] = React.useState<SyncPreference>(() => readPrefs())

  const applyResponse = React.useCallback((payload: VtopApiResponse) => {
    setMessage(payload.message)
    setState(payload.state ?? defaultState)
    if (payload.ok) {
      setError(undefined)
      if (payload.data) {
        setData(payload.data)
        writeStoredVtopData(payload.data)
      }
    } else {
      setError(payload)
    }
    return payload
  }, [])

  const refreshStatus = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/vtop/session", { cache: "no-store" })
      const payload = (await response.json()) as VtopApiResponse
      applyResponse(payload)
    } catch {
      setError({
        ok: false,
        code: "NETWORK_ERROR",
        message: "UniBoard could not check the local VTOP session.",
        recoverable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [applyResponse])

  const connect = React.useCallback(
    async (input: { username: string; password: string; remember: boolean }) => {
      setSyncing(true)
      setMessage("Opening a secure VTOP Chennai browser session...")
      try {
        const response = await fetch("/api/vtop/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        return applyResponse((await response.json()) as VtopApiResponse)
      } finally {
        setSyncing(false)
      }
    },
    [applyResponse],
  )

  const syncNow = React.useCallback(async () => {
    setSyncing(true)
    setMessage("Fetching latest attendance...")
    window.setTimeout(() => setMessage("Updating semester analytics..."), 700)
    window.setTimeout(() => setMessage("Refreshing timetable and fee records..."), 1400)
    try {
      const response = await fetch("/api/vtop/sync", { method: "POST", cache: "no-store" })
      return applyResponse((await response.json()) as VtopApiResponse)
    } finally {
      setSyncing(false)
    }
  }, [applyResponse])

  const clearSession = React.useCallback(async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/vtop/session", { method: "DELETE", cache: "no-store" })
      clearStoredVtopData()
      setData(undefined)
      return applyResponse((await response.json()) as VtopApiResponse)
    } finally {
      setSyncing(false)
    }
  }, [applyResponse])

  const setPrefs = React.useCallback((next: SyncPreference) => {
    setPrefsState(next)
    writeVtopPrefs(next)
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => void refreshStatus(), 0)
    return () => window.clearTimeout(timer)
  }, [refreshStatus])

  React.useEffect(() => {
    function syncFromStorage(event?: StorageEvent | Event) {
      if (event instanceof StorageEvent && event.key !== DATA_KEY) return
      setData(readStoredData())
    }

    window.addEventListener(DATA_EVENT, syncFromStorage)
    window.addEventListener("storage", syncFromStorage)
    return () => {
      window.removeEventListener(DATA_EVENT, syncFromStorage)
      window.removeEventListener("storage", syncFromStorage)
    }
  }, [])

  React.useEffect(() => {
    if (!options?.autoRefreshMs || !state.connected) return
    const timer = window.setInterval(() => void syncNow(), options.autoRefreshMs)
    return () => window.clearInterval(timer)
  }, [options?.autoRefreshMs, state.connected, syncNow])

  return {
    state,
    data,
    prefs,
    loading,
    syncing,
    message,
    error,
    connect,
    syncNow,
    clearSession,
    setPrefs,
    refreshStatus,
  }
}
