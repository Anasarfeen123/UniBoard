"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/toast-provider"
import { useVtopSync } from "@/hooks/use-vtop-sync"
import { AlertCircle, CheckCircle2, CreditCard, RefreshCw } from "lucide-react"

export default function FeesPage() {
  const { notify } = useToast()
  const vtop = useVtopSync()
  const fees = vtop.data?.fees ?? []
  const totalAmount = fees.reduce((acc, curr) => acc + (curr.amount ?? 0), 0)
  const totalPaid = fees.reduce((acc, curr) => acc + (curr.paid ?? 0), 0)
  const totalPending = fees.reduce((acc, curr) => acc + (curr.due ?? Math.max((curr.amount ?? 0) - (curr.paid ?? 0), 0)), 0)

  async function sync() {
    const result = await vtop.syncNow()
    notify({ title: result.ok ? "Fee details refreshed" : "Fee sync failed", description: result.message, tone: result.ok ? "success" : "warning" })
  }

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Fees & Payments</h2>
          <p className="text-sm text-muted-foreground">Financial records fetched from VTOP Chennai.</p>
        </div>
        <Button className="rounded-none gap-2 px-6" onClick={sync} disabled={vtop.syncing}>
          <RefreshCw className={vtop.syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Sync Now
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          ["Total Fee", totalAmount ? `Rs. ${totalAmount.toLocaleString("en-IN")}` : "Pending", "From VTOP fee ledger"],
          ["Paid Amount", totalPaid ? `Rs. ${totalPaid.toLocaleString("en-IN")}` : "Pending", totalAmount ? `${((totalPaid / totalAmount) * 100).toFixed(1)}% cleared` : "After latest sync"],
          ["Pending Balance", totalPending ? `Rs. ${totalPending.toLocaleString("en-IN")}` : "Pending", vtop.syncing ? "Refreshing fee records..." : "Outstanding dues if reported"],
        ].map(([label, value, detail]) => (
          <Card key={label} className="rounded-none border-border/50 bg-card/50 premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                {label === "Pending Balance" && totalPending ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold">Payment History</h3>
        <div className="overflow-hidden border border-border/50 bg-card/50">
          {fees.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="text-[10px] uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Paid</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Balance</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Due Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee, index) => (
                  <TableRow key={`${fee.label}-${index}`} className="border-border/50">
                    <TableCell className="font-medium">{fee.label}</TableCell>
                    <TableCell className="font-mono text-sm">{fee.amount ? `Rs. ${fee.amount.toLocaleString("en-IN")}` : "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{fee.paid ? `Rs. ${fee.paid.toLocaleString("en-IN")}` : "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{fee.due ? `Rs. ${fee.due.toLocaleString("en-IN")}` : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fee.dueDate ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-tighter">
                        {fee.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <p className="font-serif text-xl font-semibold">Fee details await VTOP sync</p>
              <p className="max-w-md text-sm text-muted-foreground">{vtop.error?.message ?? "Connect VTOP Chennai to populate real fee records."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
