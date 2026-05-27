import { mockFeeRecords } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { ActionButton } from "@/components/action-button";

export default function FeesPage() {
  const totalAmount = mockFeeRecords.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = mockFeeRecords.reduce((acc, curr) => acc + curr.paid, 0);
  const totalPending = totalAmount - totalPaid;

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Fees & Payments</h2>
          <p className="text-muted-foreground text-sm">Financial records for the current academic year</p>
        </div>
        <ActionButton
          className="rounded-none gap-2 px-6"
          feedback="Payment flow opened"
          detail="No dues are pending in this workspace, so no payment is required."
        >
          <CreditCard className="h-4 w-4" />
          Make Payment
        </ActionButton>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalAmount.toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Academic Year 2024-25</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">₹{totalPaid.toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {((totalPaid/totalAmount)*100).toFixed(1)}% cleared
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalPending.toLocaleString("en-IN")}</div>
            {totalPending > 0 ? (
              <p className="text-[10px] text-destructive mt-1 font-mono flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Next Due: June 15, 2024
              </p>
            ) : (
              <p className="text-[10px] text-primary mt-1 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> No outstanding dues
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-serif font-semibold">Payment History</h3>
        <div className="border border-border/50 bg-card/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50">
                <TableHead className="uppercase tracking-wider text-[10px]">Category</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Amount</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Paid</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Balance</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Due Date</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFeeRecords.map((fee) => (
                <TableRow key={fee.id} className="border-border/50">
                  <TableCell className="font-medium">{fee.category}</TableCell>
                  <TableCell className="font-mono text-sm">₹{fee.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">₹{fee.paid.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-mono text-sm">₹{(fee.amount - fee.paid).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fee.dueDate}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`rounded-none text-[10px] uppercase tracking-tighter ${
                        fee.status === 'Paid' 
                          ? 'border-primary/20 bg-primary/5' 
                          : 'border-destructive/20 bg-destructive/5 text-destructive'
                      }`}
                    >
                      {fee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ActionButton
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      feedback={`${fee.category} receipt ready`}
                      detail="A payment receipt preview has been prepared."
                    >
                      <Receipt className="h-4 w-4" />
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
