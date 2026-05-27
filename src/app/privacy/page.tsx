import Link from "next/link"
import { BookOpen } from "lucide-react"
import { FooterDisclaimer } from "@/components/footer-disclaimer"

const sections = [
  {
    title: "Unofficial Project",
    body: "UniBoard is an independent unofficial student project. It is not affiliated with, endorsed by, or officially connected to VIT, VTOP, or any university department.",
  },
  {
    title: "Credential Use",
    body: "VTOP credentials are requested only to support fetching your own academic data for your personal dashboard experience. You are responsible for deciding whether to use the platform and for complying with applicable VTOP and university policies.",
  },
  {
    title: "Private Student Data",
    body: "UniBoard is designed for a single student's private workspace. The current local prototype stores setup and session details in your browser storage so the interface can remember your workspace.",
  },
  {
    title: "No Selling Or Sharing",
    body: "UniBoard does not sell user data, share user data for advertising, or create multi-student administrative records. Demo mode uses sample data only.",
  },
  {
    title: "Your Responsibility",
    body: "You remain responsible for how you use UniBoard, including any credentials you enter and any academic decisions you make from displayed information.",
  },
]

export default function PrivacyPage() {
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
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">Privacy Policy</h1>
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
