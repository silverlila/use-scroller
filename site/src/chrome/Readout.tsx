import { useEffect, useRef, useState } from 'react'
import { observeActiveSection, observeScroll, useScrollState } from 'use-scroller'
import { formatInt } from '../hooks'
import { SECTIONS, SECTION_IDS } from '../meta'

const SAMPLES = 90
const SPARK_W = 200
const SPARK_H = 36

export function Readout({ spyOffset }: { spyOffset: number }) {
  const state = useScrollState('window')
  const active = useActiveSection(spyOffset)
  const section = SECTIONS[active]
  const direction = state.directionY === 1 ? '↓' : state.directionY === -1 ? '↑' : '·'
  const directionText = state.directionY === 1 ? 'down' : state.directionY === -1 ? 'up' : 'none'

  return (
    <div className="readout">
      <p className="readout-head">
        <span>Readout</span>
        <code>useScrollState('window')</code>
      </p>
      <dl className="readout-grid">
        <dt>y</dt>
        <dd>
          {formatInt(state.y)}
          <small>px</small>
        </dd>
        <dt>progressY</dt>
        <dd>
          {(state.progressY * 100).toFixed(1)}
          <small>%</small>
        </dd>
        <dt>directionY</dt>
        <dd>
          <span className="readout-arrow" aria-hidden="true">
            {direction}
          </span>{' '}
          {directionText}
        </dd>
        <dt>velocityY</dt>
        <dd>
          {formatInt(Math.abs(state.velocityY))}
          <small>px/s</small>
        </dd>
        <dt>isScrolling</dt>
        <dd>
          <span className={state.isScrolling ? 'led is-on' : 'led'} aria-hidden="true" />
          {state.isScrolling ? 'true' : 'false'}
        </dd>
        <dt>section</dt>
        <dd className="readout-section">{section ? `${section.num} ${section.title}` : '—'}</dd>
      </dl>
      <div className="readout-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${state.progressY})` }} />
      </div>
      <Sparkline />
    </div>
  )
}

function useActiveSection(offset: number) {
  const [active, setActive] = useState(-1)
  useEffect(() => {
    const elements = SECTION_IDS.flatMap((id) => {
      const element = document.getElementById(id)
      return element ? [element] : []
    })
    return observeActiveSection(elements, setActive, { root: window, offset })
  }, [offset])
  return active
}

function Sparkline() {
  const path = useRef<SVGPathElement>(null)
  useEffect(() => {
    const samples: number[] = []
    return observeScroll(window, (state) => {
      samples.push(state.velocityY)
      if (samples.length > SAMPLES) samples.shift()
      const peak = Math.max(1500, ...samples.map(Math.abs))
      const d = samples
        .map((value, index) => {
          const x = SPARK_W - (samples.length - 1 - index) * (SPARK_W / (SAMPLES - 1))
          const y = SPARK_H / 2 - (value / peak) * (SPARK_H / 2 - 2)
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')
      path.current?.setAttribute('d', d)
    })
  }, [])
  return (
    <figure className="spark">
      <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2={SPARK_W} y1={SPARK_H / 2} y2={SPARK_H / 2} className="spark-zero" />
        <path ref={path} className="spark-line" />
      </svg>
      <figcaption>velocityY trace · observeScroll(window)</figcaption>
    </figure>
  )
}
