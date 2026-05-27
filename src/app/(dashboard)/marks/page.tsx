import { mockAcademicRecords, currentUser } from "@/lib/mock-data";
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
import { FileText, Download } from "lucide-react";
import { ActionButton } from "@/components/action-button";

export default function MarksPage() {
  const student = currentUser; // Focusing on the current user

  return (
    <div className="space-y-8 e-ink-refresh">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Academic Records</h2>
          <p className="text-muted-foreground text-sm">Detailed performance breakdown for {student.name}</p>
        </div>
        <div className="flex gap-2">
          <ActionButton
            variant="outline"
            className="rounded-none gap-2"
            feedback="Transcript exported"
            detail="Your semester transcript has been prepared as a spreadsheet."
          >
            <Download className="h-4 w-4" />
            Export Transcript
          </ActionButton>
          <ActionButton
            className="rounded-none gap-2"
            feedback="Record entry opened"
            detail="Manual records are staged locally until the next sync."
          >
            <FileText className="h-4 w-4" />
            Add Record
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Semester GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.82</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Rank: #4 in Department</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Cumulative GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.75</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Credits Earned: 124/160</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border/50 bg-card/50 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Grade Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="text-center">
              <div className="text-xl font-bold">4</div>
              <p className="text-[8px] uppercase tracking-tighter text-muted-foreground font-mono">A-Grades</p>
            </div>
            <div className="text-center border-l border-border/50 pl-4">
              <div className="text-xl font-bold">2</div>
              <p className="text-[8px] uppercase tracking-tighter text-muted-foreground font-mono">B-Grades</p>
            </div>
            <div className="text-center border-l border-border/50 pl-4">
              <div className="text-xl font-bold">0</div>
              <p className="text-[8px] uppercase tracking-tighter text-muted-foreground font-mono">C/Below</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-serif font-semibold">Semester 4 Performance</h3>
        <div className="border border-border/50 bg-card/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50">
                <TableHead className="uppercase tracking-wider text-[10px]">Code</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Subject</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Credits</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Type</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Score</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Grade</TableHead>
                <TableHead className="uppercase tracking-wider text-[10px]">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAcademicRecords.map((record) => (
                <TableRow key={record.id} className="border-border/50">
                  <TableCell className="font-mono text-xs">{record.subjectCode}</TableCell>
                  <TableCell className="font-medium">{record.subjectName}</TableCell>
                  <TableCell className="text-sm">{record.credits}</TableCell>
                  <TableCell className="text-xs uppercase tracking-tighter text-muted-foreground">{record.testType}</TableCell>
                  <TableCell className="font-mono text-sm">{record.score}/{record.maxMarks}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none text-xs font-bold border-primary/20 bg-primary/5">
                      {record.grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{record.weightage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
