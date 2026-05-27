"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"

type ActionButtonProps = React.ComponentProps<typeof Button> & {
  feedback: string
  detail?: string
  delay?: number
}

export function ActionButton({
  children,
  feedback,
  detail,
  delay = 650,
  disabled,
  onClick,
  ...props
}: ActionButtonProps) {
  const [loading, setLoading] = React.useState(false)
  const { notify } = useToast()

  async function handleClick(event: Parameters<NonNullable<React.ComponentProps<typeof Button>["onClick"]>>[0]) {
    onClick?.(event)
    if (event.defaultPrevented) return
    setLoading(true)
    await new Promise((resolve) => window.setTimeout(resolve, delay))
    setLoading(false)
    notify({ title: feedback, description: detail, tone: "success" })
  }

  return (
    <Button {...props} disabled={disabled || loading} onClick={handleClick}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  )
}
