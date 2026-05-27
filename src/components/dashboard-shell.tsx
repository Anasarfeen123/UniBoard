"use client"

import * as React from "react"
import { Bell, RefreshCw } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AuthGate } from "@/components/auth-gate"
import { Button } from "@/components/ui/button"
import { FooterDisclaimer } from "@/components/footer-disclaimer"
import { getSessionMode, getStoredProfile } from "@/lib/app-session"
import { useToast } from "@/components/toast-provider"
import { Badge } from "@/components/ui/badge"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = React.useState(false)
  const [initials] = React.useState(() => {
    const profile = getStoredProfile()
    if (!profile?.fullName) return "AJ"
    return profile.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  })
  const [demo] = React.useState(() => getSessionMode() === "demo")
  const { notify } = useToast()

  async function syncWorkspace() {
    setSyncing(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    setSyncing(false)
    notify({
      title: demo ? "Demo data refreshed" : "Workspace synced",
      description: "Attendance, timetable, GPA, and fees are up to date.",
      tone: "success",
    })
  }

  return (
    <SidebarInset className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] grid-pattern" />
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-background/85 px-4 backdrop-blur-sm">
        <SidebarTrigger className="-ml-1" />
        <div className="mx-2 h-4 w-px bg-border/50" />
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Academic Operating System
            </h1>
            {demo ? (
              <Badge variant="outline" className="mt-1 rounded-none border-primary/20 bg-primary/5 text-[10px]">
                Demo Workspace
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open notifications"
              onClick={() =>
                notify({
                  title: "Notifications reviewed",
                  description: "No critical academic alerts need action right now.",
                })
              }
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-none gap-2 text-[10px] uppercase tracking-widest"
              disabled={syncing}
              onClick={syncWorkspace}
            >
              <RefreshCw className={syncing ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
              {syncing ? "Syncing" : "Sync"}
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[10px] font-bold">
              {initials}
            </div>
          </div>
        </div>
      </header>
      <AuthGate>
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
        <FooterDisclaimer />
      </AuthGate>
    </SidebarInset>
  )
}
