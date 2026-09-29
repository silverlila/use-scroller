import { useRef, useState, type ReactNode, type RefObject } from 'react'
import { useDragScroll, useScrollState, type ScrollState } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

const PARTS: Array<{ code: string; name: string; spec: string; draw: ReactNode }> = [
  {
    code: 'A-01',
    name: 'Ball bearing',
    spec: 'Ø 62 · 16 wide',
    draw: (
      <>
        <circle cx="80" cy="50" r="38" />
        <circle cx="80" cy="50" r="15" />
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2
          return <circle key={i} cx={80 + Math.cos(a) * 26} cy={50 + Math.sin(a) * 26} r="6" />
        })}
      </>
    ),
  },
  {
    code: 'A-02',
    name: 'Hex nut',
    spec: 'M24 · 36 AF',
    draw: (
      <>
        <polygon points="80,10 114,30 114,70 80,90 46,70 46,30" />
        <circle cx="80" cy="50" r="28" />
        <circle cx="80" cy="50" r="13" />
      </>
    ),
  },
  {
    code: 'A-03',
    name: 'Compression spring',
    spec: '8 coils · k 12',
    draw: <polyline points="20,50 30,50 38,22 50,78 62,22 74,78 86,22 98,78 110,22 122,78 130,50 140,50" />,
  },
  {
    code: 'A-04',
    name: 'Spur gear',
    spec: '18 teeth · m 2',
    draw: (
      <>
        <polygon
          points={Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2
            const r = i % 2 === 0 ? 40 : 33
            return `${(80 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
          }).join(' ')}
        />
        <circle cx="80" cy="50" r="10" />
      </>
    ),
  },
  {
    code: 'A-05',
    name: 'Angle bracket',
    spec: '60 × 40 · t 4',
    draw: (
      <>
        <polyline points="40,14 40,86 124,86 124,72 54,72 54,14 40,14" />
        <circle cx="47" cy="34" r="4" />
        <circle cx="96" cy="79" r="4" />
      </>
    ),
  },
  {
    code: 'A-06',
    name: 'Stepped shaft',
    spec: 'Ø 20 / 28 · 120',
    draw: (
      <>
        <polyline points="18,40 56,40 56,32 110,32 110,40 142,40 142,60 110,60 110,68 56,68 56,60 18,60 18,40" />
        <line x1="10" x2="150" y1="50" y2="50" className="dash" />
      </>
    ),
  },
  {
    code: 'A-07',
    name: 'Pulley',
    spec: 'Ø 90 · V-groove',
    draw: (
      <>
        <circle cx="80" cy="50" r="40" />
        <circle cx="80" cy="50" r="30" />
        <circle cx="80" cy="50" r="8" />
        <line x1="40" x2="120" y1="50" y2="50" className="dash" />
      </>
    ),
  },
  {
    code: 'A-08',
    name: 'Washer',
    spec: 'Ø 44 / 25',
    draw: (
      <>
        <circle cx="80" cy="50" r="34" />
        <circle cx="80" cy="50" r="19" />
      </>
    ),
  },
]

const selectProgress = (state: ScrollState) => state.progressX

const REACT_CODE = `import { useRef } from 'react'
import { useDragScroll } from 'use-scroller'

function Parts() {
  const track = useRef<HTMLUListElement>(null)
  useDragScroll(track, { axis: 'x', mouse: true }) // mouse: false by default

  return (
    <ul ref={track} style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
      {parts.map((part) => (
        <li key={part.code} style={{ scrollSnapAlign: 'start' }}>
          <button onClick={() => open(part)}>{part.name}</button>
        </li>
      ))}
    </ul>
  )
}`

const CORE_CODE = `import { dragScroll } from 'use-scroller/core'

const stop = dragScroll(track, { axis: 'x', mouse: false })
// sets touch-action: pan-y pinch-zoom on the track while attached
stop()`

export function DragSection() {
  return (
    <Section
      id="drag-scroll"
      kicker="Swipe tracks and carousels · React hook + core"
      signature="useDragScroll(ref, { axis?: 'x' | 'y', mouse?: boolean })"
    >
      <p className="lede">
        Axis-locked swiping for a horizontal (or vertical) track. A gesture is judged after 8 px:
        mostly sideways and the track follows the finger, otherwise the page scrolls natively.
        Release continues with momentum and lands on a CSS scroll-snap position if there is one.
      </p>
      <Figure
        n="06"
        title="Parts tray: drag it with a mouse, swipe it with a finger"
        legend={[
          <>
            The <code>&lt;ul ref={'{track}'}&gt;</code>. With <code>mouse: true</code> a mouse can
            drag it; wheel, trackpad, keyboard and the scrollbar stay native.
          </>,
          <>
            Cards snap with <code>scroll-snap-align: start</code>; the fling lands on the same snap
            points.
          </>,
          <>
            A drag does not fire a click. Only a tap opens a part, which the readout records.
          </>,
        ]}
      >
        <DragDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Parts.tsx', code: REACT_CODE },
          { label: 'Core', file: 'track.ts', code: CORE_CODE },
        ]}
      />
      <p className="fine">
        On touch screens it sets <code>touch-action: pan-y pinch-zoom</code> on the track (
        <code>pan-x pinch-zoom</code> for <code>axis: 'y'</code>), so cross-axis movement scrolls
        the page and pinch-zoom keeps working. Compare with the native track: a slightly diagonal
        swipe there can move both. It assumes <code>writing-mode: horizontal-tb</code>.
      </p>
    </Section>
  )
}

function DragDemo() {
  const [enhanced, setEnhanced] = useState(true)
  const [opened, setOpened] = useState<string | null>(null)
  return (
    <div className="dg">
      <div className="dg-bar">
        <div className="seg" role="group" aria-label="Track behaviour">
          <button type="button" className="seg-btn" aria-pressed={enhanced} onClick={() => setEnhanced(true)}>
            useDragScroll
          </button>
          <button type="button" className="seg-btn" aria-pressed={!enhanced} onClick={() => setEnhanced(false)}>
            native
          </button>
        </div>
        <p className="dg-readout" aria-live="polite">
          {opened ? `Opened ${opened}` : 'Tap a part to open it; dragging should not.'}
        </p>
      </div>
      {enhanced ? <EnhancedTrack onOpen={setOpened} /> : <Track onOpen={setOpened} />}
    </div>
  )
}

function EnhancedTrack({ onOpen }: { onOpen: (name: string) => void }) {
  const track = useRef<HTMLUListElement>(null)
  useDragScroll(track, { axis: 'x', mouse: true })
  return <Track trackRef={track} onOpen={onOpen} enhanced />
}

function Track({
  trackRef,
  onOpen,
  enhanced = false,
}: {
  trackRef?: RefObject<HTMLUListElement | null>
  onOpen: (name: string) => void
  enhanced?: boolean
}) {
  const local = useRef<HTMLUListElement>(null)
  const ref = trackRef ?? local
  return (
    <div className="dg-track-wrap">
      <ul ref={ref} className={enhanced ? 'dg-track is-enhanced' : 'dg-track'} aria-label="Parts">
        {PARTS.map((part, index) => (
          <li key={part.code} className="dg-item">
            <button type="button" className="part" onClick={() => onOpen(`${part.code} · ${part.name}`)}>
              <svg viewBox="0 0 160 100" className="part-draw" aria-hidden="true">
                <line x1="80" x2="80" y1="4" y2="96" className="dash" />
                <line x1="8" x2="152" y1="50" y2="50" className="dash" />
                {part.draw}
              </svg>
              <span className="part-code">{part.code}</span>
              <span className="part-name">{part.name}</span>
              <span className="part-spec">{part.spec}</span>
            </button>
            {index === 1 && <Callout n={2} lead="down" style={{ top: -16, left: 12 }} />}
            {index === 0 && <Callout n={3} lead="left" style={{ bottom: 12, right: 10 }} />}
          </li>
        ))}
      </ul>
      <Callout n={1} lead="none" style={{ top: -11, right: 16 }} />
      <TrackProgress track={ref} />
    </div>
  )
}

function TrackProgress({ track }: { track: RefObject<HTMLUListElement | null> }) {
  const progress = useScrollState(track, selectProgress)
  return (
    <div className="dg-progress" aria-hidden="true">
      <span className="dg-progress-fill" style={{ transform: `scaleX(${progress})` }} />
      <span className="dg-progress-label">progressX {progress.toFixed(2)}</span>
    </div>
  )
}
