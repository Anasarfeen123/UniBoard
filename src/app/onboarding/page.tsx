"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, Camera, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { FooterDisclaimer } from "@/components/footer-disclaimer"
import { setSessionMode, storeProfile, type SetupProfile } from "@/lib/app-session"
import { useToast } from "@/components/toast-provider"

const steps = ["Identity", "VTOP Access", "Academic Details", "Profile"]

export default function OnboardingPage() {
  const router = useRouter()
  const { notify } = useToast()
  const [step, setStep] = React.useState(0)
  const [showPassword, setShowPassword] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [profile, setProfile] = React.useState<SetupProfile>({
    fullName: "",
    vtopUsername: "",
    registrationNumber: "",
    branch: "",
    semester: "4",
  })

  const progress = ((step + 1) / steps.length) * 100

  function update(field: keyof SetupProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function canContinue() {
    if (step === 0) return profile.fullName.trim().length > 2
    if (step === 1) return profile.vtopUsername.trim().length > 2
    if (step === 2) {
      return (
        profile.registrationNumber.trim().length > 4 &&
        profile.branch.trim().length > 2 &&
        profile.semester.trim().length > 0
      )
    }
    return true
  }

  async function finish() {
    setSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    storeProfile(profile)
    setSessionMode("student")
    notify({
      title: "Workspace setup complete",
      description: "Your private UniBoard workspace is ready.",
      tone: "success",
    })
    router.push("/")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.05] paper-noise" />
      <div className="absolute inset-0 opacity-[0.035] grid-pattern" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-xl font-bold">UniBoard</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">First-time setup</p>
            </div>
          </div>
          <Button variant="ghost" className="rounded-none" onClick={() => router.push("/login")}>
            Exit
          </Button>
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-6">
            <div>
              <h1 className="text-balance font-serif text-4xl font-bold leading-tight">Build your personal academic notebook.</h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                UniBoard is designed for one student workspace. Setup stays focused on your VIT academic context only.
              </p>
            </div>
            <div className="space-y-3">
              {steps.map((label, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${index <= step ? "bg-primary" : "bg-border"}`} />
                  <span className={`text-sm ${index === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                </div>
              ))}
            </div>
            <p className="flex items-start gap-2 border border-border bg-card/50 p-4 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Your credentials are only used to securely fetch your academic data. This project is unofficial and independent.
            </p>
          </aside>

          <Card className="h-fit rounded-none border-border bg-card/70 paper-shadow e-ink-refresh">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-8">
                <div className="mb-3 h-1 bg-muted">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Step {step + 1} of {steps.length} / {steps[step]}
                </p>
              </div>

              {step === 0 ? (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold">What should UniBoard call you?</h2>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <Input
                      value={profile.fullName}
                      onChange={(event) => update("fullName", event.target.value)}
                      placeholder="Aarav Raman"
                      className="rounded-none bg-background"
                    />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold">Connect your VTOP access.</h2>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP Username</label>
                    <Input
                      value={profile.vtopUsername}
                      onChange={(event) => update("vtopUsername", event.target.value)}
                      placeholder="your.vtop.id"
                      className="rounded-none bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">VTOP Password</label>
                    <div className="relative">
                      <Input
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
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold">Add your academic identity.</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Registration Number</label>
                      <Input
                        value={profile.registrationNumber}
                        onChange={(event) => update("registrationNumber", event.target.value)}
                        placeholder="24BCE1001"
                        className="rounded-none bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Semester</label>
                      <Input
                        value={profile.semester}
                        onChange={(event) => update("semester", event.target.value)}
                        placeholder="4"
                        className="rounded-none bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Course / Branch</label>
                    <Input
                      value={profile.branch}
                      onChange={(event) => update("branch", event.target.value)}
                      placeholder="B.Tech Computer Science"
                      className="rounded-none bg-background"
                    />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold">Finish your workspace.</h2>
                  <button
                    type="button"
                    className="flex w-full flex-col items-center justify-center border border-dashed border-border bg-background/60 p-8 text-center transition-colors hover:bg-muted/40"
                    onClick={() =>
                      notify({
                        title: "Profile picture noted",
                        description: "Image upload is simulated for this local prototype.",
                      })
                    }
                  >
                    <Camera className="mb-3 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Optional profile picture</span>
                    <span className="mt-1 text-xs text-muted-foreground">Click to simulate adding a photo</span>
                  </button>
                  <div className="border border-border bg-background/50 p-4 text-sm">
                    <p className="font-medium">{profile.fullName || "Student"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {profile.registrationNumber || "Registration number"} / {profile.branch || "Course"} / Semester{" "}
                      {profile.semester || "4"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-10 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none gap-2"
                  disabled={step === 0 || saving}
                  onClick={() => setStep((value) => value - 1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    type="button"
                    className="rounded-none gap-2"
                    disabled={!canContinue()}
                    onClick={() => setStep((value) => value + 1)}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" className="rounded-none gap-2" disabled={saving} onClick={finish}>
                    {saving ? "Creating workspace..." : "Finish Setup"}
                    {!saving ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <FooterDisclaimer />
      </main>
    </div>
  )
}
