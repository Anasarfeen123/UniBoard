"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Download, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/toast-provider"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const classes = [
  { day: "Mon", time: "08:00", title: "Data Structures", room: "SJT 301" },
  { day: "Mon", time: "10:00", title: "Operating Systems", room: "TT 214" },
  { day: "Tue", time: "09:00", title: "Database Systems", room: "SJT 407" },
  { day: "Wed", time: "11:00", title: "Discrete Mathematics", room: "MB 102" },
  { day: "Thu", time: "14:00", title: "Algorithms Lab", room: "PRP 204" },
  { day: "Fri", time: "10:00", title: "Computer Networks", room: "SJT 312" },
]

export default function TimetablePage() {
  const [weekOffset, setWeekOffset] = React.useState(0)
  const [offline, setOffline] = React.useState(false)
  const { notify } = useToast()

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-sm text-muted-foreground">Your weekly academic rhythm at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-none gap-2" onClick={() => setWeekOffset((value) => value - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" className="rounded-none gap-2" onClick={() => setWeekOffset((value) => value + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            className="rounded-none gap-2"
            onClick={() =>
              notify({
                title: "Timetable exported",
                description: "A timetable snapshot has been prepared for download.",
                tone: "success",
              })
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="rounded-none border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
            <CalendarDays className="h-4 w-4" />
            {weekOffset === 0 ? "Current Week" : weekOffset > 0 ? `Week +${weekOffset}` : `Week ${weekOffset}`}
          </CardTitle>
          <Button variant="ghost" className="rounded-none text-xs" onClick={() => setOffline((value) => !value)}>
            {offline ? "Show Classes" : "Simulate No Internet"}
          </Button>
        </CardHeader>
        <CardContent>
          {offline ? (
            <EmptyState
              icon={WifiOff}
              title="No internet connection"
              description="Your cached timetable remains safe. Reconnect and sync to refresh room or slot changes."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-5">
              {days.map((day) => (
                <div key={day} className="min-h-80 border border-border/50 bg-background/40">
                  <div className="border-b border-border/50 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{day}</p>
                  </div>
                  <div className="space-y-2 p-3">
                    {classes.filter((item) => item.day === day).length ? (
                      classes
                        .filter((item) => item.day === day)
                        .map((item) => (
                          <div key={`${item.day}-${item.time}`} className="premium-card border border-border bg-card p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs">{item.time}</span>
                              <Badge variant="outline" className="rounded-none text-[9px]">{item.room}</Badge>
                            </div>
                            <p className="mt-2 text-sm font-medium">{item.title}</p>
                          </div>
                        ))
                    ) : (
                      <p className="pt-8 text-center text-xs text-muted-foreground">No scheduled classes</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
