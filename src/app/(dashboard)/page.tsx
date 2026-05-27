"use client"

import Link from "next/link";
import { PerformanceChart } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@/lib/mock-data";
import { 
  BookOpen, 
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import { useVtopSync } from "@/hooks/use-vtop-sync";

export default function DashboardPage() {
  const vtop = useVtopSync();
  const data = vtop.data;
  
  const displayName = data?.profile?.fullName.split(' ')[0] || currentUser.name.split(' ')[0];
  const gpa = data?.gpa?.[0]?.cgpa ?? data?.gpa?.[0]?.gpa ?? currentUser.gpa;
  
  const attendanceRecords = data?.attendance ?? [];
  const totalClasses = attendanceRecords.reduce((sum, r) => sum + r.total, 0);
  const attendedClasses = attendanceRecords.reduce((sum, r) => sum + r.attended, 0);
  const attendancePercentage = totalClasses > 0 
    ? (attendedClasses / totalClasses) * 100 
    : (attendanceRecords[0]?.percentage ?? currentUser.attendance);

  const credits = data?.gpa?.[0]?.credits ?? 124;
  const lastSync = data?.syncedAt ? new Date(data.syncedAt).toLocaleDateString() : "24 May 2026";

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Personal Workspace</h2>
          <p className="text-muted-foreground text-sm">Welcome back, {displayName}</p>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1 border border-border/50">
          Last Updated: {lastSync}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current GPA
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeof gpa === 'number' ? gpa.toFixed(2) : gpa}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-primary font-bold">{data ? "Synced" : "+0.07"}</span> {data ? "from VTOP Chennai" : "from last assessment"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Attendance
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeof attendancePercentage === 'number' ? attendancePercentage.toFixed(1) : attendancePercentage}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {totalClasses > 0 ? `${attendedClasses}/${totalClasses} sessions completed` : "92/98 sessions completed"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Credits Earned
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              On track for Graduation 2026
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Finances
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data?.fees?.[0]?.due ?? 0}</div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter rounded-none border-primary/20 bg-primary/5 mt-1">
              {data?.fees?.[0]?.status ?? "No Dues"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 rounded-none border-border/50 bg-card/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-widest">Performance History</CardTitle>
            <Link href="/marks" className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 text-[10px] uppercase tracking-widest gap-2" })}>
              Full Transcript <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pl-2">
            <PerformanceChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-widest">Personal Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { title: "Mid-Term Grades Published", subject: "Operating Systems", time: "2h ago" },
                { title: "Attendance Warning", subject: "Discrete Mathematics", time: "5h ago", warn: true },
                { title: "Library Due Date", subject: "Clean Code", time: "Tomorrow" },
                { title: "Semester Registration", subject: "Registration Portal Open", time: "2 days ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 premium-card border-b border-border/30 pb-3 last:border-0">
                  <div className={`mt-1 h-2 w-2 rounded-full ${item.warn ? 'bg-destructive' : 'bg-primary'}`} />
                  <div className="space-y-1">
                    <p className="text-xs font-medium leading-none">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.subject} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <ActionButton
              variant="outline"
              className="mt-6 w-full rounded-none"
              feedback="Notifications refreshed"
              detail="No new critical updates were found."
            >
              Refresh Notifications
            </ActionButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
