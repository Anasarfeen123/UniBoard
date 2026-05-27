"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Lock, LogOut, RefreshCw, ShieldCheck, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { clearSession, getStoredProfile } from "@/lib/app-session"
import { useToast } from "@/components/toast-provider"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { notify } = useToast()
  const [profile] = React.useState(() => {
    const stored = getStoredProfile()
    if (stored) {
      return {
        fullName: stored.fullName,
        registrationNumber: stored.registrationNumber,
        branch: stored.branch,
        semester: stored.semester,
      }
    }
    return {
      fullName: "Aarav Raman",
      registrationNumber: "24BCE1001",
      branch: "B.Tech Computer Science",
      semester: "4",
    }
  })

  function signOut() {
    clearSession()
    notify({ title: "Signed out", description: "Your local UniBoard session has ended." })
    router.replace("/login")
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your private UniBoard workspace.</p>
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</label>
              <Input value={profile.fullName} readOnly className="rounded-none bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Registration Number</label>
              <Input value={profile.registrationNumber} readOnly className="rounded-none bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Course / Branch</label>
              <Input value={profile.branch} readOnly className="rounded-none bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Semester</label>
              <Input value={profile.semester} readOnly className="rounded-none bg-background" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <RefreshCw className="h-4 w-4" />
              Sync Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Attendance", "Timetable", "Grades", "Fees"].map((item) => (
              <label key={item} className="flex items-center justify-between border-b border-border/40 pb-3 text-sm">
                <span>{item}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-foreground" />
              </label>
            ))}
            <Button
              className="w-full rounded-none gap-2"
              onClick={() =>
                notify({
                  title: "Sync preferences saved",
                  description: "Future refreshes will use your selected data sources.",
                  tone: "success",
                })
              }
            >
              <RefreshCw className="h-4 w-4" />
              Save Sync Preferences
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
              <Button
                key={mode}
                variant={theme === mode ? "default" : "outline"}
                className="w-full rounded-none capitalize"
                onClick={() => setTheme(mode)}
              >
                {mode}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <Lock className="h-4 w-4" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Local session persistence is enabled for this browser.</p>
            <p>Credentials are used only for fetching student data in this personal workspace.</p>
            <Button
              variant="outline"
              className="w-full rounded-none gap-2"
              onClick={() =>
                notify({
                  title: "Privacy settings reviewed",
                  description: "No external sharing or selling is enabled.",
                })
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Review Privacy
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
              <Bell className="h-4 w-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="outline" className="rounded-none border-primary/20 bg-primary/5">Active Workspace</Badge>
            <p className="text-sm text-muted-foreground">
              UniBoard is an independent unofficial student project and is not affiliated with VIT or VTOP.
            </p>
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
