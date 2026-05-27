"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/toast-provider"
import { useVtopSync } from "@/hooks/use-vtop-sync"
import { CalendarCheck, RefreshCw } from "lucide-react"

export default function AttendancePage() {
  const { notify } = useToast()
  const vtop = useVtopSync()
  const records = vtop.data?.attendance ?? []
  const total = records.reduce((sum, item) => sum + item.total, 0)
  const attended = records.reduce((sum, item) => sum + item.attended, 0)
  const overall = total ? (attended / total) * 100 : undefined

  async function sync() {
    const result = await vtop.syncNow()
    notify({ title: result.ok ? "Attendance refreshed" : "Attendance sync failed", description: result.message, tone: result.ok ? "success" : "warning" })
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Attendance</h2>
          <p className="text-sm text-muted-foreground">Live subject-wise attendance from VTOP Chennai.</p>
        </div>
        <Button className="rounded-none gap-2 px-6" onClick={sync} disabled={vtop.syncing}>
          <RefreshCw className={vtop.syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Sync Now
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          ["Overall Attendance", overall ? `${overall.toFixed(1)}%` : "Pending", "Computed from VTOP subjects"],
          ["Total Sessions", total || "Pending", "Current synced semester"],
          ["Missed Classes", total ? total - attended : "Pending", vtop.syncing ? "Fetching latest attendance..." : "After latest sync"],
        ].map(([label, value, detail]) => (
          <Card key={label} className="rounded-none border-border/50 bg-card/50 premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold">Subject-wise Attendance</h3>
        <div className="overflow-hidden border border-border/50 bg-card/50">
          {records.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="text-[10px] uppercase tracking-wider">Subject</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Total</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Attended</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Percentage</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((item) => (
                  <TableRow key={`${item.courseCode}-${item.courseTitle}`} className="border-border/50">
                    <TableCell className="font-medium">{item.courseCode ? `${item.courseCode} · ${item.courseTitle}` : item.courseTitle}</TableCell>
                    <TableCell className="font-mono text-sm">{item.total}</TableCell>
                    <TableCell className="font-mono text-sm">{item.attended}</TableCell>
                    <TableCell className="font-mono text-sm">{item.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-tighter">
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <CalendarCheck className="h-8 w-8 text-muted-foreground" />
              <p className="font-serif text-xl font-semibold">Attendance awaits VTOP sync</p>
              <p className="max-w-md text-sm text-muted-foreground">{vtop.error?.message ?? "Connect or refresh VTOP Chennai to populate live attendance."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
