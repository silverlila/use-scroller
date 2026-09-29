import { useRef } from 'react'
import { useScrollRestoration } from 'use-scroller'
import { DESTINATIONS } from '../data'

const ROWS = Array.from({ length: 120 }, (_, i) => ({
  row: i + 1,
  place: DESTINATIONS[i % DESTINATIONS.length],
}))

export function RestoreDemo() {
  const list = useRef<HTMLOListElement>(null)
  useScrollRestoration(list, 'restore-demo')

  return (
    <div className="space-y-4">
      <ol
        ref={list}
        aria-label="Destinations"
        className="h-72 divide-y divide-black/5 overflow-y-auto rounded-xl bg-white ring-1 ring-black/5"
      >
        {ROWS.map(({ row, place }) => (
          <li key={row} className="flex items-baseline justify-between gap-3 px-4 py-3">
            <span className="text-gray-700">
              <span className="mr-3 text-gray-400 tabular-nums">{row}</span>
              {place.city}
            </span>
            <span className="text-sm text-gray-500">{place.country}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition-[background-color,scale] hover:bg-gray-200 active:scale-[0.96]"
      >
        Reload page
      </button>
    </div>
  )
}
