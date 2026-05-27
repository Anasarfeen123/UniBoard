import { currentUser } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, GraduationCap, MapPin, Book } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-8 e-ink-refresh">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground text-sm">Personal information and academic standing</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 rounded-none border-border bg-card/50">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-32 w-32 rounded-full border-2 border-primary flex items-center justify-center mb-4">
                <User className="h-16 w-16 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold">{currentUser.name}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">{currentUser.rollNo}</p>
              <Badge variant="outline" className="mt-4 rounded-none border-primary/20 bg-primary/5 px-4">
                Active Student
              </Badge>
            </div>
            
            <div className="mt-8 space-y-4 pt-8 border-t border-border/50">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{currentUser.department}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Book className="h-4 w-4" />
                <span>Semester {currentUser.semester} (Year {currentUser.year})</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Campus Main, Block B</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-none border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-widest">Academic Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border border-border/50 bg-background/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current CGPA</p>
                <div className="mt-2 text-2xl font-bold">{currentUser.cgpa}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Calculated across 4 semesters</p>
              </div>
              <div className="p-4 border border-border/50 bg-background/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Major</p>
                <div className="mt-2 text-2xl font-bold">Software Eng.</div>
                <p className="text-[10px] text-muted-foreground mt-1">Specialization: Distributed Systems</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest">Enrolled Courses</h4>
              <div className="space-y-2">
                {[
                  "CS201 - Data Structures & Algorithms",
                  "CS202 - Theory of Computation",
                  "CS203 - Operating Systems",
                  "CS204 - Database Management Systems",
                  "MA201 - Discrete Mathematics",
                ].map((course, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-border/30 text-sm">
                    <span>{course}</span>
                    <Badge variant="ghost" className="text-[10px] font-mono">ENROLLED</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
