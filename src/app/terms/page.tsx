import Link from "next/link"
import { BookOpen } from "lucide-react"
import { FooterDisclaimer } from "@/components/footer-disclaimer"

const sections = [
  {
    title: "Independent Unofficial Service",
    body: "UniBoard is an independent unofficial project and is not associated with VIT, VTOP, or any official university system.",
  },
  {
    title: "Personal Educational Use",
    body: "The platform is intended for personal academic productivity, planning, and educational organization for one student workspace.",
  },
  {
    title: "Use At Your Discretion",
    body: "You choose to use UniBoard at your own discretion. Verify important academic, attendance, fee, and timetable information against official university sources.",
  },
  {
    title: "Service Changes",
    body: "UniBoard may change, pause, or stop at any time. Features shown in this prototype may be simulated or adapted as the project evolves.",
  },
  {
    title: "No Official Advice",
    body: "UniBoard does not provide official academic, financial, legal, or administrative advice. It is a personal dashboard experience only.",
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link href="/login" className="mb-10 inline-flex items-center gap-3 text-sm">
          <span className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl font-bold">UniBoard</span>
        </Link>
        <div className="border border-border bg-card/50 p-6 sm:p-10 e-ink-refresh">
          <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">Legal</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Last updated: May 27, 2026</p>
          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-xl font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
        <FooterDisclaimer />
      </div>
    </main>
  )
}
