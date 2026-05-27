"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FooterDisclaimer } from "@/components/footer-disclaimer"
import { getStoredProfile, setSessionMode, storeProfile } from "@/lib/app-session"
import { useToast } from "@/components/toast-provider"

export default function LoginPage() {
  const router = useRouter()
  const { notify } = useToast()
  const [loading, setLoading] = React.useState<"login" | "demo" | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading("login")
    await new Promise((resolve) => window.setTimeout(resolve, 850))
    const profile = getStoredProfile()
    if (!profile) {
      notify({
        title: "Setup needed first",
        description: "Create your private student workspace before signing in.",
        tone: "warning",
      })
      router.push("/onboarding")
      return
    }
    setSessionMode("student")
    notify({
      title: remember ? "Secure session restored" : "Signed in for this session",
      description: "Your academic workspace is ready.",
      tone: "success",
    })
    router.push("/")
  }

  async function tryDemo() {
    setLoading("demo")
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    storeProfile({
      fullName: "Aarav Raman",
      vtopUsername: "demo.vit",
      registrationNumber: "24BCE1001",
      branch: "B.Tech Computer Science",
      semester: "4",
    })
    setSessionMode("demo")
    notify({
      title: "Demo workspace opened",
      description: "Explore sample attendance, GPA, fees, timetable, and analytics.",
      tone: "success",
    })
    router.push("/")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.05] paper-noise" />
      <div className="absolute inset-0 opacity-[0.04] grid-pattern" />
      <main className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-[36vh] flex-col justify-between border-b border-border/50 p-6 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-2xl font-bold tracking-tight">UniBoard</p>
              <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">Personal Academic OS</p>
            </div>
          </div>

          <div className="max-w-xl py-14 lg:py-0">
            <p className="mb-4 inline-flex items-center gap-2 border border-border bg-background/60 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Built for students who want clarity, not clutter.
            </p>
            <h1 className="text-balance font-serif text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
              Your calm command center for VIT academics.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
              Track attendance, GPA, timetable, fees, and personal academic signals in one quiet workspace.
            </p>
          </div>

          <FooterDisclaimer />
        </section>

        <section className="flex items-center justify-center p-6 lg:p-10">
          <Card className="w-full max-w-md rounded-none border-border bg-card/70 paper-shadow e-ink-refresh">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="font-serif text-2xl font-semibold">Sign in</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your credentials are only used to securely fetch your academic data.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP Username</label>
                  <Input required placeholder="your.vtop.id" className="rounded-none bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP Password</label>
                  <div className="relative">
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="rounded-none bg-background pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-3.5 w-3.5 accent-foreground"
                  />
                  Remember this private session
                </label>

                <Button type="submit" className="h-10 w-full rounded-none gap-2" disabled={loading !== null}>
                  {loading === "login" ? "Opening workspace..." : "Enter Workspace"}
                  {loading !== "login" ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-none gap-2"
                disabled={loading !== null}
                onClick={tryDemo}
              >
                <Sparkles className="h-4 w-4" />
                {loading === "demo" ? "Preparing demo..." : "Try Demo"}
              </Button>

              <div className="mt-6 space-y-3 border-t border-border/50 pt-6">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Secure-looking local session flow for a personal dashboard. No data selling or sharing.
                </p>
                <p className="text-xs text-muted-foreground">
                  First time here?{" "}
                  <Link href="/onboarding" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Set up UniBoard
                  </Link>
                </p>
                <div className="flex gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                  <Link href="/terms" className="hover:text-foreground">Terms</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
