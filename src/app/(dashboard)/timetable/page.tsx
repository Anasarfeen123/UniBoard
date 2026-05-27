"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/toast-provider"
import { useVtopSync } from "@/hooks/use-vtop-sync"
import { CalendarDays, Download, RefreshCw, WifiOff } from "lucide-react"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function TimetablePage() {
  const [offline, setOffline] = React.useState(false)
  const { notify } = useToast()
  const vtop = useVtopSync()
  const classes = vtop.data?.timetable ?? []

  async function sync() {
    const result = await vtop.syncNow()
    notify({ title: result.ok ? "Timetable refreshed" : "Timetable sync failed", description: result.message, tone: result.ok ? "success" : "warning" })
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-sm text-muted-foreground">Your weekly academic rhythm from VTOP Chennai.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-none gap-2" onClick={() => setOffline((value) => !value)}>
            <WifiOff className="h-4 w-4" />
            {offline ? "Show Live Data" : "Offline State"}
          </Button>
          <Button variant="outline" className="rounded-none gap-2" onClick={() => notify({ title: "Export prepared", description: "The latest synced timetable snapshot is ready.", tone: "success" })}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="rounded-none gap-2" onClick={sync} disabled={vtop.syncing}>
            <RefreshCw className={vtop.syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync Now
          </Button>
        </div>
      </div>

      <Card className="rounded-none border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
            <CalendarDays className="h-4 w-4" />
            Synced Week
          </CardTitle>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {vtop.syncing ? "Refreshing timetable..." : vtop.data?.syncedAt ? `Last sync ${new Date(vtop.data.syncedAt).toLocaleString()}` : "No sync yet"}
          </span>
        </CardHeader>
        <CardContent>
          {offline ? (
            <EmptyState icon={WifiOff} title="No internet connection" description="Your cached timetable remains safe. Reconnect and sync to refresh room or slot changes." />
          ) : classes.length ? (
            <div className="grid gap-3 md:grid-cols-6">
              {days.map((day) => {
                const entries = classes.filter((item) => item.day.toLowerCase().startsWith(day.toLowerCase()))
                return (
                  <div key={day} className="min-h-80 border border-border/50 bg-background/40">
                    <div className="border-b border-border/50 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{day}</p>
                    </div>
                    <div className="space-y-2 p-3">
                      {entries.length ? (
                        entries.map((item, index) => (
                          <div key={`${item.day}-${item.startTime}-${index}`} className="premium-card border border-border bg-card p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs">{item.startTime}{item.endTime ? `-${item.endTime}` : ""}</span>
                              {item.room ? <Badge variant="outline" className="rounded-none text-[9px]">{item.room}</Badge> : null}
                            </div>
                            <p className="mt-2 text-sm font-medium">{item.courseTitle}</p>
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground">{item.courseCode || item.slot}</p>
                          </div>
                        ))
                      ) : (
                        <p className="pt-8 text-center text-xs text-muted-foreground">No scheduled classes</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="Timetable awaits VTOP sync" description={vtop.error?.message ?? "Connect VTOP Chennai to populate real class slots, rooms, and course codes."} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
