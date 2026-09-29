import { useEffect, useMemo, useState } from 'react'
import { useScrollState, type ScrollState } from 'use-scroller'
import { useViewportHeight, formatInt } from '../hooks'
import { SECTIONS } from '../meta'

const RULER_WIDTH = 72
const STEPS = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000]
const selectMaxY = (state: ScrollState) => state.maxY
const selectY = (state: ScrollState) => state.y

export function Ruler() {
  const maxY = useScrollState('window', selectMaxY)
  const viewport = useViewportHeight()
  const documentHeight = Math.max(maxY + viewport, 1)
  return (
    <div className="ruler" aria-hidden="true">
      <RulerScale documentHeight={documentHeight} viewport={viewport} />
      <RulerWindow documentHeight={documentHeight} viewport={viewport} />
    </div>
  )
}

function useSectionTops(documentHeight: number) {
  const [tops, setTops] = useState<number[]>([])
  useEffect(() => {
    setTops(
      SECTIONS.map((section) => {
        const element = document.getElementById(section.id)
        return element ? element.getBoundingClientRect().top + window.scrollY : 0
      })
    )
  }, [documentHeight])
  return tops
}

function RulerScale({ documentHeight, viewport }: { documentHeight: number; viewport: number }) {
  const tops = useSectionTops(documentHeight)
  const scale = viewport / documentHeight
  const major = STEPS.find((step) => step * scale >= 56) ?? STEPS[STEPS.length - 1]
  const minor = major / 5
  const ticks = useMemo(() => {
    const list: Array<{ at: number; kind: 'major' | 'minor' }> = []
    for (let at = 0, i = 0; at <= documentHeight; at += minor, i++) {
      list.push({ at, kind: i % 5 === 0 ? 'major' : 'minor' })
    }
    return list
  }, [documentHeight, minor])

  return (
    <svg className="ruler-scale" width={RULER_WIDTH} height={viewport}>
      {ticks.map(({ at, kind }) => {
        const y = Math.round(at * scale) + 0.5
        const length = kind === 'major' ? 16 : 7
        return (
          <g key={at}>
            <line x1={RULER_WIDTH - length} x2={RULER_WIDTH} y1={y} y2={y} className={`tick tick-${kind}`} />
            {kind === 'major' && at > 0 && (
              <text x={RULER_WIDTH - 20} y={y + 3.5} textAnchor="end" className="tick-label">
                {at >= 1000 ? `${at / 1000}k` : at}
              </text>
            )}
          </g>
        )
      })}
      {tops.map((top, index) => {
        const y = Math.round(top * scale) + 0.5
        return (
          <g key={SECTIONS[index].id} className="ruler-section">
            <line x1={0} x2={10} y1={y} y2={y} />
            <text x={3} y={y + 11}>
              {SECTIONS[index].num}
            </text>
          </g>
        )
      })}
      <text x={RULER_WIDTH - 20} y={12} textAnchor="end" className="tick-label tick-unit">
        px
      </text>
    </svg>
  )
}

function RulerWindow({ documentHeight, viewport }: { documentHeight: number; viewport: number }) {
  const y = useScrollState('window', selectY)
  const scale = viewport / documentHeight
  return (
    <div
      className="ruler-window"
      style={{ transform: `translateY(${y * scale}px)`, height: Math.max(viewport * scale, 6) }}
    >
      <span className="ruler-y">{formatInt(y)}</span>
    </div>
  )
}
