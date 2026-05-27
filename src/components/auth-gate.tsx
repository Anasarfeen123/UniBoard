"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { getSessionMode, getStoredProfile } from "@/lib/app-session"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const mode = getSessionMode()
    const profile = getStoredProfile()
    if (!mode && !profile) {
      router.replace("/login")
      return
    }
    const timer = window.setTimeout(() => setReady(true), 0)
    return () => window.clearTimeout(timer)
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center e-ink-refresh">
          <div className="mx-auto h-10 w-10 border border-primary bg-muted animate-pulse" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Opening workspace</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
