import { useRef, useState } from 'react'
import {
  easings,
  useScroll,
  useScrollState,
  type ScrollAnimation,
  type ScrollHandle,
  type ScrollResult,
} from 'use-scroller'

type AnimationKind = 'tween' | 'spring'

const ANIMATIONS: Record<AnimationKind, ScrollAnimation> = {
  tween: { type: 'tween' },
  spring: { type: 'spring' },
}

const SLOW: ScrollAnimation = { type: 'tween', duration: 6000, easing: easings.linear }
const TARGET_ROW = 30
const ROWS = Array.from({ length: 60 }, (_, i) => i + 1)

const buttonClass =
  'rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition-[background-color,transform] hover:bg-gray-200 active:scale-[0.96]'

export function ProgrammaticDemo() {
  const [kind, setKind] = useState<AnimationKind>('tween')
  const [result, setResult] = useState<ScrollResult | 'running' | null>(null)
  const { ref, scrollToEdge, scrollToElement, scrollBy } = useScroll<HTMLOListElement>({
    animation: ANIMATIONS[kind],
  })
  const atBottom = useScrollState(ref, (state) => state.atBottom)
  const targetRow = useRef<HTMLLIElement>(null)

  const latest = useRef<ScrollHandle | null>(null)

  function report(handle: ScrollHandle) {
    latest.current = handle
    setResult('running')
    void handle.finished.then((outcome) => {
      if (latest.current === handle) setResult(outcome)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="mr-2 inline-flex rounded-lg bg-gray-100 p-1"
          role="group"
          aria-label="Animation"
        >
          {(['tween', 'spring'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 capitalize aria-pressed:bg-white aria-pressed:text-gray-900 aria-pressed:shadow-sm"
            >
              {option}
            </button>
          ))}
        </div>
        <button type="button" className={buttonClass} onClick={() => report(scrollToEdge('top'))}>
          Top
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => report(scrollToEdge('bottom'))}
        >
          Bottom
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => report(scrollToElement(targetRow, { align: 'center' }))}
        >
          Row {TARGET_ROW}
        </button>
        <button type="button" className={buttonClass} onClick={() => report(scrollBy({ y: 200 }))}>
          +200px
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => report(scrollToEdge(atBottom ? 'top' : 'bottom', { animation: SLOW }))}
        >
          Slow scroll, try to stop it
        </button>
      </div>
      <ol
        ref={ref}
        className="h-72 divide-y divide-black/5 overflow-y-auto rounded-xl bg-white ring-1 ring-black/5"
      >
        {ROWS.map((row) => (
          <li
            key={row}
            ref={row === TARGET_ROW ? targetRow : undefined}
            className={
              row === TARGET_ROW
                ? 'bg-indigo-50 px-4 py-3 font-medium text-indigo-700 tabular-nums'
                : 'px-4 py-3 text-gray-700 tabular-nums'
            }
          >
            Row {row}
          </li>
        ))}
      </ol>
      <p className="text-sm text-gray-500" aria-live="polite">
        {result
          ? `Last animation: ${result}`
          : 'Wheel, touch or a key press on the list interrupts a running animation.'}
      </p>
    </div>
  )
}
