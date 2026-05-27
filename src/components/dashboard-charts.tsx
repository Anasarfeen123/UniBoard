"use client"

import {
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { MeasuredChart } from "@/components/measured-chart"

const data = [
  { semester: "Sem 1", gpa: 3.2 },
  { semester: "Sem 2", gpa: 3.5 },
  { semester: "Sem 3", gpa: 3.4 },
  { semester: "Sem 4", gpa: 3.8 },
]

export function PerformanceChart() {
  return (
    <MeasuredChart height={300}>
      {(width, height) => (
        <AreaChart data={data} width={width} height={height}>
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="semester"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "0px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="gpa"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#grid)"
            fillOpacity={1}
          />
        </AreaChart>
      )}
    </MeasuredChart>
  )
}
