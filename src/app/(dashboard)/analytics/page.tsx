"use client"

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { Download, Share2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";

const subjectPerformance = [
  { name: "Data Structures", avg: 9.2 },
  { name: "Algorithms", avg: 8.8 },
  { name: "Operating Systems", avg: 9.4 },
  { name: "Database Systems", avg: 8.7 },
  { name: "Networks", avg: 8.1 },
];

const growthData = [
  { month: "Jan", attendance: 85, performance: 70 },
  { month: "Feb", attendance: 88, performance: 75 },
  { month: "Mar", attendance: 92, performance: 82 },
  { month: "Apr", attendance: 90, performance: 88 },
  { month: "May", attendance: 94, performance: 92 },
];

export default function AnalyticsPage() {
  const [range, setRange] = React.useState("Semester")
  const { notify } = useToast()

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground text-sm">Personal academic trends and semester signals</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-none gap-2"
            onClick={() => {
              setRange((value) => (value === "Semester" ? "Monthly" : "Semester"))
              notify({ title: "Analytics filter changed", description: "Charts now reflect the selected academic range." })
            }}
          >
            <Filter className="h-4 w-4" />
            {range}
          </Button>
          <Button
            variant="outline"
            className="rounded-none gap-2"
            onClick={() =>
              notify({
                title: "Share link prepared",
                description: "A private read-only analytics summary is ready to copy.",
                tone: "success",
              })
            }
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            className="rounded-none gap-2"
            onClick={() =>
              notify({
                title: "Analytics report exported",
                description: "Your personal academic report has been generated.",
                tone: "success",
              })
            }
          >
            <Download className="h-4 w-4" />
            Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-widest">Subject Strength Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.split(' ')[0]}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "0px",
                    }}
                  />
                  <Bar dataKey="avg" fill="var(--primary)" radius={[0, 0, 0, 0]}>
                    {subjectPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.15} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-widest">Growth Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "0px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="var(--primary)" 
                    strokeWidth={2} 
                    dot={{ strokeWidth: 2, r: 4, fill: 'var(--background)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="performance" 
                    stroke="var(--muted-foreground)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ strokeWidth: 2, r: 4, fill: 'var(--background)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Strongest Subject", value: "OS", trend: "+2.1%" },
          { label: "Avg Attendance", value: "88.4%", trend: "+0.5%" },
          { label: "Pass Rate", value: "94.2%", trend: "+1.2%" },
          { label: "Fee Status", value: "No Dues", trend: "100%" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-none border-border/50 bg-card/50 premium-card">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold">{stat.value}</span>
                <span className="text-[10px] font-mono text-primary">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
