"use client"

import * as React from "react"
import { BookOpen } from "lucide-react"
import { hasSeenSplash, markSplashSeen } from "@/lib/app-session"

const messages = [
  "Preparing your workspace",
  "Syncing academic data",
  "Building your semester overview",
]

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = React.useState(true)
  const [messageIndex, setMessageIndex] = React.useState(0)

  React.useEffect(() => {
    if (hasSeenSplash()) {
      const seenTimer = window.setTimeout(() => setShowSplash(false), 0)
      return () => window.clearTimeout(seenTimer)
    }

    const messageTimer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % messages.length)
    }, 700)
    const finishTimer = window.setTimeout(() => {
      markSplashSeen()
      setShowSplash(false)
    }, 2300)

    return () => {
      window.clearInterval(messageTimer)
      window.clearTimeout(finishTimer)
    }
  }, [])

  if (!showSplash) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.04] paper-noise" />
      <div className="absolute inset-0 opacity-[0.05] grid-pattern" />
      <div className="relative flex flex-col items-center text-center e-ink-refresh">
        <div className="logo-pulse mb-6 flex h-16 w-16 items-center justify-center border border-primary bg-primary text-primary-foreground">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight">UniBoard</h1>
        <p className="mt-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Personal Academic OS
        </p>
        <div className="mt-8 h-px w-64 overflow-hidden bg-border">
          <div className="splash-line h-full w-24 bg-primary" />
        </div>
        <p className="mt-4 min-h-4 text-xs text-muted-foreground">{messages[messageIndex]}</p>
      </div>
    </div>
  )
}
