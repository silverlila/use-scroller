import { useRef, useState, type Ref } from 'react'
import { useDragScroll } from 'use-scroller'
import { DESTINATIONS } from '../data'
import { Comparison, Panel } from './Panel'

export function SwipeTrackDemo() {
  const enhanced = useRef<HTMLUListElement>(null)
  useDragScroll(enhanced, { mouse: true })

  return (
    <Comparison>
      <Panel label="Native">
        <CardTrack />
      </Panel>
      <Panel label="With useDragScroll" accent>
        <CardTrack ref={enhanced} />
      </Panel>
    </Comparison>
  )
}

function CardTrack({ ref }: { ref?: Ref<HTMLUListElement> }) {
  const [opened, setOpened] = useState<string | null>(null)

  return (
    <div>
      <ul
        ref={ref}
        className="-mx-5 flex scroll-px-5 snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-1 pb-3 sm:-mx-10 sm:scroll-px-10 sm:px-10 md:-mx-2 md:scroll-px-2 md:px-2"
      >
        {DESTINATIONS.map((place) => (
          <li key={place.city} className="w-[58%] shrink-0 snap-start sm:w-52">
            <button
              type="button"
              onClick={() => setOpened(place.city)}
              className="block w-full overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.98]"
            >
              <div className={`aspect-[16/10] bg-linear-to-br ${place.gradient}`} />
              <div className="p-3">
                <p className="font-semibold text-gray-900">{place.city}</p>
                <p className="text-sm text-gray-500">
                  {place.country} · from <span className="tabular-nums">€{place.price}</span>
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500" aria-live="polite">
        {opened ? `Tapped ${opened}` : 'Tapping opens a card; swiping shouldn’t.'}
      </p>
    </div>
  )
}
