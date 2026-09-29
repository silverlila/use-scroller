import type { RefObject } from 'react'
import { useScroll, useScrollState, type ScrollState } from 'use-scroller'
import { DESTINATIONS } from '../data'

const selectProgress = (state: ScrollState) => state.progressX
const selectAtLeft = (state: ScrollState) => state.atLeft
const selectAtRight = (state: ScrollState) => state.atRight

const arrowClass =
  'flex size-11 items-center justify-center rounded-full bg-white text-lg text-gray-800 shadow-md ring-1 ring-black/5 transition-[opacity,transform] active:scale-[0.96] disabled:opacity-30'

type Target = RefObject<HTMLElement | null>

export function ScrollStateDemo() {
  const { ref, scrollBy } = useScroll()

  function page(direction: -1 | 1) {
    const width = ref.current?.clientWidth ?? 0
    scrollBy({ x: direction * width * 0.8 })
  }

  return (
    <div className="space-y-4">
      <ScrollProgress target={ref} />
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-3">
        {DESTINATIONS.map((place) => (
          <div key={place.city} className="w-40 shrink-0">
            <div className={`aspect-square rounded-xl bg-linear-to-br ${place.gradient}`} />
            <p className="mt-2 text-sm font-medium text-gray-900">{place.city}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <EdgeButtons target={ref} onPage={page} />
      </div>
    </div>
  )
}

function ScrollProgress({ target }: { target: Target }) {
  const progress = useScrollState(target, selectProgress)
  const percent = Math.round(progress * 100)

  return (
    <div className="flex flex-1 items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-label="Scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full origin-left rounded-full bg-indigo-500"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <p className="w-10 text-right text-sm text-gray-500 tabular-nums">{percent}%</p>
    </div>
  )
}

function EdgeButtons({ target, onPage }: { target: Target; onPage: (direction: -1 | 1) => void }) {
  const atLeft = useScrollState(target, selectAtLeft)
  const atRight = useScrollState(target, selectAtRight)

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={arrowClass}
        aria-label="Previous"
        disabled={atLeft}
        onClick={() => onPage(-1)}
      >
        ←
      </button>
      <button
        type="button"
        className={arrowClass}
        aria-label="Next"
        disabled={atRight}
        onClick={() => onPage(1)}
      >
        →
      </button>
    </div>
  )
}
