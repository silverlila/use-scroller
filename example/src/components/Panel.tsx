import type { ReactNode } from 'react'

interface PanelProps {
  label: string
  accent?: boolean
  children: ReactNode
}

export function Panel({ label, accent = false, children }: PanelProps) {
  return (
    <div className="min-w-0 space-y-3">
      <span
        className={
          accent
            ? 'inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700'
            : 'inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600'
        }
      >
        {label}
      </span>
      {children}
    </div>
  )
}

export function Comparison({ children }: { children: ReactNode }) {
  return <div className="grid gap-8 md:grid-cols-2">{children}</div>
}
