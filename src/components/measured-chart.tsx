"use client"

import * as React from "react"

export function MeasuredChart({
  height = 300,
  children,
}: {
  height?: number
  children: (width: number, height: number) => React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry.contentRect.width)
      if (nextWidth > 0) setWidth(nextWidth)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="mt-4 w-full" style={{ height }}>
      {width > 0 ? (
        children(width, height)
      ) : (
        <div className="h-full w-full animate-pulse border border-border/50 bg-muted/30" />
      )}
    </div>
  )
}
