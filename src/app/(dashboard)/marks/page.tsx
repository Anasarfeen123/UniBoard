"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/toast-provider"
import { useVtopSync } from "@/hooks/use-vtop-sync"
import { FileText, RefreshCw } from "lucide-react"

export default function MarksPage() {
  const { notify } = useToast()
  const vtop = useVtopSync()
  const marks = vtop.data?.marks ?? []
  const latest = vtop.data?.gpa.find((item) => item.cgpa || item.gpa)
  const graded = marks.filter((item) => item.grade).length

  async function sync() {
    const result = await vtop.syncNow()
    notify({ title: result.ok ? "Academic records refreshed" : "Marks sync failed", description: result.message, tone: result.ok ? "success" : "warning" })
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Academic Records</h2>
          <p className="text-sm text-muted-foreground">Marks, GPA, and grade history synced from VTOP Chennai.</p>
        </div>
        <Button className="rounded-none gap-2" onClick={sync} disabled={vtop.syncing}>
          <RefreshCw className={vtop.syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Sync Now
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          ["Semester GPA", latest?.gpa?.toFixed(2) ?? "Pending", "From latest VTOP grade view"],
          ["Cumulative GPA", latest?.cgpa?.toFixed(2) ?? "Pending", "Fetched after successful sync"],
          ["Grade Entries", graded || "Pending", vtop.syncing ? "Updating semester analytics..." : "Synced assessment rows"],
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
        <h3 className="font-serif text-lg font-semibold">Synced Assessment Records</h3>
        <div className="overflow-hidden border border-border/50 bg-card/50">
          {marks.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="text-[10px] uppercase tracking-wider">Code</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Subject</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Assessment</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Score</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((record, index) => (
                  <TableRow key={`${record.courseCode}-${record.assessment}-${index}`} className="border-border/50">
                    <TableCell className="font-mono text-xs">{record.courseCode || "-"}</TableCell>
                    <TableCell className="font-medium">{record.courseTitle}</TableCell>
                    <TableCell className="text-xs uppercase tracking-tighter text-muted-foreground">{record.assessment}</TableCell>
                    <TableCell className="font-mono text-sm">{record.scored ?? "-"}{record.max ? `/${record.max}` : ""}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-none text-xs font-bold">
                        {record.grade ?? "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="font-serif text-xl font-semibold">Marks await VTOP sync</p>
              <p className="max-w-md text-sm text-muted-foreground">{vtop.error?.message ?? "Connect VTOP Chennai to populate real marks and GPA."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
