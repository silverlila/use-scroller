import { useEffect, useRef, useState, type RefObject } from 'react'
import { observeScroll, useScrollState, type ScrollState } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

const REACT_CODE = `import { useRef } from 'react'
import { useScrollState } from 'use-scroller'

function Sheet() {
  const ref = useRef<HTMLDivElement>(null)
  const state = useScrollState(ref)                   // re-renders on every change
  const atEnd = useScrollState(ref, (s) => s.atRight) // re-renders only when it flips
  return <div ref={ref} style={{ overflow: 'auto' }}>…</div>
}

// Hide a header while scrolling down. directionY keeps its last value when
// scrolling stops, so the header stays hidden until the user scrolls up.
function Header() {
  const hidden = useScrollState('window', (s) => s.directionY === 1 && s.y > 64)
  return <header className={hidden ? 'header header--hidden' : 'header'}>…</header>
}`

const CORE_CODE = `import { observeScroll } from 'use-scroller/core'

// Emits once on subscribe, then at most once per frame when something changed,
// including when the content or the container resizes.
const stop = observeScroll(
  sheet,
  (state) => log(state.isScrolling ? 'scroll start' : \`idle at \${state.x}, \${state.y}\`),
  { idleDelay: 250 } // isScrolling turns false after 250 ms without scroll events
)

stop()`

type Row = { key: keyof ScrollState; note: string }

const GROUPS: Array<{ name: string; rows: Row[] }> = [
  {
    name: 'Position',
    rows: [
      { key: 'x', note: 'scrollLeft' },
      { key: 'y', note: 'scrollTop' },
      { key: 'minX', note: '< 0 in RTL' },
      { key: 'maxX', note: 'furthest x' },
      { key: 'maxY', note: 'furthest y' },
      { key: 'progressX', note: '0 – 1' },
      { key: 'progressY', note: '0 – 1' },
    ],
  },
  {
    name: 'Edges',
    rows: [
      { key: 'atTop', note: '' },
      { key: 'atBottom', note: '' },
      { key: 'atLeft', note: 'RTL-aware' },
      { key: 'atRight', note: 'RTL-aware' },
      { key: 'canScrollX', note: 'overflows' },
      { key: 'canScrollY', note: 'overflows' },
    ],
  },
  {
    name: 'Motion',
    rows: [
      { key: 'directionX', note: '−1 · 0 · 1' },
      { key: 'directionY', note: '−1 · 0 · 1' },
      { key: 'velocityX', note: 'px/s' },
      { key: 'velocityY', note: 'px/s' },
      { key: 'isScrolling', note: 'idleDelay' },
    ],
  },
]

function show(value: ScrollState[keyof ScrollState]) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Number.isInteger(value)) return String(value)
  return Math.abs(value) < 10 ? value.toFixed(3) : String(Math.round(value))
}

export function StateSection() {
  return (
    <Section
      id="scroll-state"
      kicker="Scroll state · React hook + core"
      signature="useScrollState(ref | 'window', select?) → ScrollState | T"
    >
      <p className="lede">
        Live position, edges, progress, direction and velocity for a container or the page. Pass a
        selector and the component re-renders only when the selected value changes. The ruler and
        readout framing this page are built with it.
      </p>
      <Figure
        n="04"
        title="Every ScrollState field, read from one container"
        className="fig-state"
        legend={[
          <>A container that scrolls on both axes. Drag its scrollbars, use a trackpad, or focus it and use the arrow keys.</>,
          <>
            <code>useScrollState(sheet)</code> with no selector: the table re-renders on every
            change. Values that just changed are marked.
          </>,
          <>
            <code>observeScroll(sheet, …, {'{ idleDelay: 250 }'})</code> from core, logging each
            time <code>isScrolling</code> flips.
          </>,
        ]}
      >
        <StateDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Sheet.tsx', code: REACT_CODE },
          { label: 'Core', file: 'sheet.ts', code: CORE_CODE },
        ]}
      />
      <p className="fine">
        Edges and progress are correct in RTL. Before mount and on the server every position is 0,
        every edge is reached and nothing can scroll.
      </p>
    </Section>
  )
}

function StateDemo() {
  const sheet = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = sheet.current
    if (!element) return
    element.scrollTo({
      left: (element.scrollWidth - element.clientWidth) / 2,
      top: (element.scrollHeight - element.clientHeight) / 2 - 60,
      behavior: 'instant',
    })
  }, [])
  return (
    <div className="st">
      <div className="st-left">
        <div className="st-sheet-wrap">
          <div ref={sheet} className="st-sheet scroll-box" tabIndex={0} aria-label="Drawing sheet, scrolls both ways">
            <FlangeDrawing />
          </div>
          <Callout n={1} lead="down" style={{ top: -30, left: 20 }} />
        </div>
        <EventLog sheet={sheet} />
      </div>
      <StateTable sheet={sheet} />
    </div>
  )
}

function StateTable({ sheet }: { sheet: RefObject<HTMLDivElement | null> }) {
  const state = useScrollState(sheet)
  const previous = useRef(state)
  const changed = new Set<string>()
  for (const group of GROUPS) {
    for (const row of group.rows) {
      if (previous.current[row.key] !== state[row.key]) changed.add(row.key)
    }
  }
  useEffect(() => {
    previous.current = state
  })

  return (
    <div className="st-table-wrap">
      <table className="st-table">
        <caption className="sr-only">ScrollState of the drawing sheet</caption>
        {GROUPS.map((group) => (
          <tbody key={group.name}>
            <tr>
              <th colSpan={3} scope="colgroup" className="st-group">
                {group.name}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.key} className={changed.has(row.key) ? 'is-changed' : undefined}>
                <th scope="row">{row.key}</th>
                <td className="st-value">{show(state[row.key])}</td>
                <td className="st-note">{row.note}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <Callout n={2} lead="left" out style={{ top: 6, right: -34 }} />
    </div>
  )
}

interface LogEntry {
  id: number
  at: string
  text: string
}

function EventLog({ sheet }: { sheet: RefObject<HTMLDivElement | null> }) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  useEffect(() => {
    const element = sheet.current
    if (!element) return
    let scrolling = false
    let id = 0
    const began = { x: 0, y: 0 }
    return observeScroll(
      element,
      (state) => {
        if (state.isScrolling === scrolling) return
        scrolling = state.isScrolling
        const at = new Date().toISOString().slice(14, 23)
        const text = scrolling
          ? `scroll start at ${Math.round(state.x)}, ${Math.round(state.y)}`
          : `idle at ${Math.round(state.x)}, ${Math.round(state.y)} · moved ${Math.round(Math.hypot(state.x - began.x, state.y - began.y))} px`
        if (scrolling) Object.assign(began, { x: state.x, y: state.y })
        const entry = { id: ++id, at, text }
        setEntries((current) => [entry, ...current].slice(0, 5))
      },
      { idleDelay: 250 }
    )
  }, [sheet])

  return (
    <div className="st-log">
      <p className="st-log-head">
        observeScroll log <span>idleDelay 250</span>
      </p>
      <ol className="st-log-list">
        {entries.length === 0 && <li className="st-log-empty">Scroll the sheet to log events.</li>}
        {entries.map((entry) => (
          <li key={entry.id}>
            <time>{entry.at}</time> {entry.text}
          </li>
        ))}
      </ol>
      <Callout n={3} lead="left" out style={{ top: 8, right: -34 }} />
    </div>
  )
}

function FlangeDrawing() {
  const cx = 700
  const cy = 520
  const bolts = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2
    return { x: cx + Math.cos(angle) * 250, y: cy + Math.sin(angle) * 250 }
  })
  return (
    <svg className="flange" width="1400" height="1040" viewBox="0 0 1400 1040" aria-hidden="true">
      <defs>
        <pattern id="st-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" className="hatch-line" />
        </pattern>
      </defs>
      <rect x="20" y="20" width="1360" height="1000" className="fl-frame" />
      <line x1={cx - 420} x2={cx + 420} y1={cy} y2={cy} className="fl-center" />
      <line x1={cx} x2={cx} y1={cy - 420} y2={cy + 420} className="fl-center" />
      <circle cx={cx} cy={cy} r="340" className="fl-edge" />
      <circle cx={cx} cy={cy} r="250" className="fl-center" />
      <circle cx={cx} cy={cy} r="150" fill="url(#st-hatch)" className="fl-edge" />
      <circle cx={cx} cy={cy} r="90" className="fl-edge fl-bore" />
      {bolts.map((bolt, index) => (
        <g key={index}>
          <circle cx={bolt.x} cy={bolt.y} r="26" className="fl-edge" />
          <line x1={bolt.x - 36} x2={bolt.x + 36} y1={bolt.y} y2={bolt.y} className="fl-center" />
          <line x1={bolt.x} x2={bolt.x} y1={bolt.y - 36} y2={bolt.y + 36} className="fl-center" />
        </g>
      ))}
      <line x1={cx - 340} x2={cx + 340} y1={cy + 400} y2={cy + 400} className="fl-dim" />
      <text x={cx} y={cy + 390} textAnchor="middle" className="fl-text">
        Ø 680
      </text>
      <text x="48" y="64" className="fl-text">
        FLANGE · 8 × M24 on Ø 500
      </text>
      <text x="1352" y="1000" textAnchor="end" className="fl-text">
        1400 × 1040 px
      </text>
      <text x="48" y="1000" className="fl-text">
        ← scroll both ways →
      </text>
    </svg>
  )
}
