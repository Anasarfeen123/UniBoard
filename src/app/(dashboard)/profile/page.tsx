"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/toast-provider"
import { useVtopSync } from "@/hooks/use-vtop-sync"
import { Book, CalendarClock, GraduationCap, Mail, RefreshCw, ShieldCheck, User } from "lucide-react"

function ProfileSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <Card className="rounded-none border-border bg-card/50 md:col-span-1">
        <CardContent className="space-y-4 pt-8">
          <Skeleton className="mx-auto h-32 w-32 rounded-full" />
          <Skeleton className="mx-auto h-6 w-44 rounded-none" />
          <Skeleton className="mx-auto h-4 w-28 rounded-none" />
        </CardContent>
      </Card>
      <Card className="rounded-none border-border bg-card/50 md:col-span-2">
        <CardContent className="grid gap-4 pt-8 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-none" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { notify } = useToast()
  const { data, loading, syncing, message, error, syncNow, state } = useVtopSync({ autoRefreshMs: 1000 * 60 * 20 })
  const profile = data?.profile
  const latestGpa = data?.gpa.find((item) => item.cgpa || item.gpa)
  const attendanceAverage = data?.attendance.length
    ? data.attendance.reduce((total, item) => total + item.percentage, 0) / data.attendance.length
    : undefined

  async function handleSync() {
    const result = await syncNow()
    if (result.ok) {
      notify({ title: "Profile updated", description: "Fetched latest identity and academic status from VTOP Chennai.", tone: "success" })
    } else {
      notify({ title: "Sync needs attention", description: result.message, tone: "warning" })
    }
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">VTOP Identity</h2>
          <p className="text-sm text-muted-foreground">
            Live profile details from VTOP Chennai. UniBoard is unofficial and for personal academic productivity only.
          </p>
        </div>
        <Button className="rounded-none gap-2" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {syncing ? "Syncing" : "Sync Now"}
        </Button>
      </div>

      {loading ? <ProfileSkeleton /> : null}

      {!loading && !profile ? (
        <Card className="rounded-none border-border bg-card/50">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/5">
                {error?.code ?? "VTOP_NOT_CONNECTED"}
              </Badge>
              <h3 className="font-serif text-2xl font-semibold">Reconnect VTOP Chennai</h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {error?.message ??
                  "Profile data is not available yet. Connect your VTOP Chennai account to auto-populate this dashboard."}
              </p>
            </div>
            <Button className="rounded-none" onClick={() => router.push("/login")}>
              Re-login to VTOP
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {profile ? (
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="rounded-none border-border bg-card/50 md:col-span-1">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-background">
                  {profile.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-16 w-16 text-primary/40" />
                  )}
                </div>
                <h3 className="text-xl font-bold">{profile.fullName || "VTOP Student"}</h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{profile.registrationNumber || state.username}</p>
                <Badge variant="outline" className="mt-4 rounded-none border-primary/20 bg-primary/5 px-4">
                  {profile.academicStatus || "Active Student"}
                </Badge>
              </div>

              <div className="mt-8 space-y-4 border-t border-border/50 pt-8">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email || "Email unavailable from VTOP"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{profile.branch || profile.program || "Program unavailable"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Book className="h-4 w-4" />
                  <span>Semester {profile.semester || "not reported"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Connected to VTOP Chennai only</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border bg-card/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-widest">Academic Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["Current CGPA", latestGpa?.cgpa?.toFixed(2) ?? "Pending", "Fetched from VTOP grade history"],
                  ["Attendance", attendanceAverage ? `${attendanceAverage.toFixed(1)}%` : "Pending", "Subject average after latest sync"],
                  ["Last Sync", data.syncedAt ? new Date(data.syncedAt).toLocaleString() : "Never", message],
                ].map(([label, value, detail]) => (
                  <div key={label} className="border border-border/50 bg-background/50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                    <div className="mt-2 text-2xl font-bold">{value}</div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Registration Number", profile.registrationNumber],
                  ["Program", profile.program],
                  ["Course / Branch", profile.branch],
                  ["School", profile.school],
                  ["Department", profile.department],
                  ["Academic Status", profile.academicStatus],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-border/40 pb-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-medium">{value || "Not reported by VTOP"}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span>{syncing ? message : `Last synced ${new Date(data.syncedAt).toLocaleString()}`}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
