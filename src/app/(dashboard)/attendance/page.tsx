import { currentUser } from "@/lib/mock-data";
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
import { CalendarCheck, ListCheck } from "lucide-react";
import { ActionButton } from "@/components/action-button";

export default function AttendancePage() {
  const student = currentUser;

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Attendance</h2>
          <p className="text-muted-foreground text-sm">Track daily and subject-wise attendance</p>
        </div>
        <ActionButton
          className="rounded-none gap-2 px-6"
          feedback="Attendance refreshed"
          detail="Latest demo attendance sessions have been reconciled."
        >
          <CalendarCheck className="h-4 w-4" />
          Refresh Attendance
        </ActionButton>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{student.attendance}%</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Status: Satisfactory</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">128</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Current Semester</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Missed Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-[10px] text-destructive mt-1 font-mono flex items-center gap-1">
              Limit: 25 classes per semester
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-serif font-semibold">Subject-wise Attendance</h3>
        <div className="border border-border/50 bg-card/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50">
                <TableHead className="uppercase tracking-wider text-[10px]">Subject</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Total Classes</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Attended</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Percentage</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { subject: "Data Structures", total: 32, attended: 30, pct: 93.7 },
                { subject: "Algorithms", total: 32, attended: 28, pct: 87.5 },
                { subject: "Operating Systems", total: 32, attended: 31, pct: 96.8 },
                { subject: "Database Systems", total: 32, attended: 29, pct: 90.6 },
              ].map((item, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell className="font-medium">{item.subject}</TableCell>
                  <TableCell className="font-mono text-sm">{item.total}</TableCell>
                  <TableCell className="font-mono text-sm">{item.attended}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{item.pct}%</span>
                      <div className="h-1.5 w-24 bg-muted/50 overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${item.pct}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`rounded-none text-[10px] uppercase tracking-tighter ${
                        item.pct >= 75 
                          ? 'border-primary/20 bg-primary/5' 
                          : 'border-destructive/20 bg-destructive/5 text-destructive'
                      }`}
                    >
                      {item.pct >= 75 ? 'On Track' : 'Low Attendance'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ActionButton
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      feedback={`${item.subject} details opened`}
                      detail="Session history and safe-bunk estimate are available in the attendance view."
                    >
                      <ListCheck className="h-4 w-4" />
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
