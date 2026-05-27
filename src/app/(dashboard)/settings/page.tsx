"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Link2, Lock, LogOut, RefreshCw, ShieldCheck, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { clearSession, getStoredProfile } from "@/lib/app-session"
import { defaultSyncPrefs, useVtopSync } from "@/hooks/use-vtop-sync"
import { useToast } from "@/components/toast-provider"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { notify } = useToast()
  const vtop = useVtopSync({ autoRefreshMs: 1000 * 60 * 20 })
  const [profile] = React.useState(() => getStoredProfile())
  const [prefs, setPrefs] = React.useState(vtop.prefs)

  async function signOut() {
    await vtop.clearSession()
    clearSession()
    notify({ title: "Signed out", description: "Your UniBoard and VTOP session have ended." })
    router.replace("/login")
  }

  async function syncNow() {
    const result = await vtop.syncNow()
    notify({
      title: result.ok ? "VTOP synced" : "Sync failed",
      description: result.message,
      tone: result.ok ? "success" : "warning",
    })
  }

  async function clearVtop() {
    const result = await vtop.clearSession()
    notify({
      title: "VTOP session cleared",
      description: result.message,
      tone: "success",
    })
  }

  function savePrefs() {
    vtop.setPrefs(prefs)
    notify({
      title: "Sync preferences saved",
      description: "Future automatic refreshes will use your selected VTOP data areas.",
      tone: "success",
    })
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your private VTOP Chennai connection and UniBoard workspace.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <Link2 className="h-4 w-4" />
              Connected VTOP Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/5">
                {vtop.state.connected ? "Connected to VTOP Chennai" : "Not connected"}
              </Badge>
              <span className="text-xs text-muted-foreground">{vtop.state.source}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-border/50 bg-background/50 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last Sync</p>
                <p className="mt-1 text-sm font-medium">
                  {vtop.state.lastSyncedAt ? new Date(vtop.state.lastSyncedAt).toLocaleString() : "Never synced"}
                </p>
              </div>
              <div className="border border-border/50 bg-background/50 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Session</p>
                <p className="mt-1 text-sm font-medium">
                  {vtop.state.sessionExpiresAt ? `Expires ${new Date(vtop.state.sessionExpiresAt).toLocaleTimeString()}` : "Reconnect required"}
                </p>
              </div>
            </div>
            {vtop.error ? <p className="text-sm text-muted-foreground">{vtop.error.message}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-none gap-2" onClick={syncNow} disabled={vtop.syncing || !vtop.state.connected}>
                <RefreshCw className={vtop.syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Manual Refresh
              </Button>
              <Button variant="outline" className="rounded-none" onClick={() => router.push("/login")}>
                Reconnect VTOP
              </Button>
              <Button variant="outline" className="rounded-none gap-2" onClick={clearVtop}>
                <Trash2 className="h-4 w-4" />
                Clear Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <RefreshCw className="h-4 w-4" />
              Data Sync Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(defaultSyncPrefs) as Array<keyof typeof defaultSyncPrefs>).map((item) => (
              <label key={item} className="flex items-center justify-between border-b border-border/40 pb-3 text-sm capitalize">
                <span>{item === "history" ? "Academic history" : item}</span>
                <input
                  type="checkbox"
                  checked={prefs[item]}
                  onChange={(event) => setPrefs((current) => ({ ...current, [item]: event.target.checked }))}
                  className="h-4 w-4 accent-foreground"
                />
              </label>
            ))}
            <Button className="w-full rounded-none gap-2" onClick={savePrefs}>
              <RefreshCw className="h-4 w-4" />
              Save Sync Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <User className="h-4 w-4" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ["Full Name", vtop.data?.profile?.fullName ?? profile?.fullName ?? ""],
              ["Registration Number", vtop.data?.profile?.registrationNumber ?? profile?.registrationNumber ?? ""],
              ["Course / Branch", vtop.data?.profile?.branch ?? profile?.branch ?? ""],
              ["Semester", vtop.data?.profile?.semester ?? profile?.semester ?? ""],
            ].map(([label, value]) => (
              <div key={label} className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
                <Input value={value || "Pending VTOP sync"} readOnly className="rounded-none bg-background" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <Lock className="h-4 w-4" />
              Trust & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Your VTOP credentials are only used to securely fetch your academic data.</p>
            <p>Users log in at their own discretion. UniBoard is for personal academic productivity only.</p>
            <p>UniBoard is an independent unofficial student project and is not affiliated with VIT or VTOP.</p>
            <Button variant="outline" className="w-full rounded-none gap-2" onClick={() => notify({ title: "Privacy reviewed", description: "No data selling or external sharing is enabled." })}>
              <ShieldCheck className="h-4 w-4" />
              Review Privacy
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-widest">Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["light", "dark", "system"].map((mode) => (
              <Button key={mode} variant={theme === mode ? "default" : "outline"} className="w-full rounded-none capitalize" onClick={() => setTheme(mode)}>
                {mode}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <Bell className="h-4 w-4" />
              Refresh Rhythm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Auto refresh runs every 20 minutes while the app is open and your VTOP session is valid.</p>
            <p>{vtop.syncing ? vtop.message : "Manual refresh is available from the top bar and this settings page."}</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <LogOut className="h-4 w-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/5">Active Workspace</Badge>
            <Button variant="destructive" className="w-full rounded-none gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
