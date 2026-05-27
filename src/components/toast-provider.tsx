"use client"

import * as React from "react"
import { CheckCircle2, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Toast = {
  id: number
  title: string
  description?: string
  tone?: "default" | "success" | "warning"
}

type ToastContextValue = {
  notify: (toast: Omit<Toast, "id">) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const notify = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now()
    setToasts((items) => [...items, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "e-ink-refresh border border-border bg-background/95 p-4 paper-shadow backdrop-blur-sm",
              toast.tone === "warning" && "border-destructive/30",
            )}
          >
            <div className="flex items-start gap-3">
              {toast.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
              ) : (
                <Info className="mt-0.5 h-4 w-4" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>
                ) : null}
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Dismiss notification"
                onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }
  return context
}
