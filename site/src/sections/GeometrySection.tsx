import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import {
  findScrollParent,
  isScrollable,
  observeScroll,
  readScroll,
  type Axis,
  type ScrollMetrics,
  type ScrollTarget,
} from 'use-scroller'
import { formatInt } from '../hooks'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

type ProbeId = 'P1' | 'P2' | 'P3' | 'P4'
type ContainerId = 'outer' | 'strip' | 'inner'

const PROBES: Array<{ id: ProbeId; where: string }> = [
  { id: 'P1', where: 'on the sheet, outside every box' },
  { id: 'P2', where: 'inside the outer box' },
  { id: 'P3', where: 'inside the sideways strip' },
  { id: 'P4', where: 'inside the inner box' },
]
const CONTAINERS: ContainerId[] = ['outer', 'strip', 'inner']
const METRIC_KEYS: Array<keyof ScrollMetrics> = ['x', 'y', 'minX', 'maxX', 'maxY', 'viewportWidth', 'viewportHeight']

const CODE = `import { readScroll, isScrollable, findScrollParent } from 'use-scroller/core'

readScroll(target)
// → { x, y, minX, maxX, maxY, viewportWidth, viewportHeight }

isScrollable(element, 'y')
// true when overflow-y is auto | scroll | overlay AND the content overflows

findScrollParent(probe, 'y')
// the nearest ancestor that isScrollable on that axis, or window`

export function GeometrySection() {
  return (
    <Section
      id="geometry"
      kicker="Low-level helpers · core"
      signature="readScroll(target) · isScrollable(element, axis) · findScrollParent(element, axis)"
    >
      <p className="lede">
        The measurements every other function is built on, exported for your own code. Use them
        to find which container a deeply nested element actually scrolls in, or to read a
        target’s range without subscribing to anything.
      </p>
      <Figure
        n="11"
        title="Inspector: pick a probe, find its scroll parent, read it"
        legend={[
          <>
            Pick a probe. <code>findScrollParent(probe, axis)</code> walks up to the nearest
            scrollable ancestor, outlined heavy. P1 has none, so the answer is{' '}
            <code>window</code>.
          </>,
          <>
            Switch the axis: P3’s parent on <code>'x'</code> is the strip, on <code>'y'</code> the
            outer box.
          </>,
          <>
            <code>readScroll(parent)</code>, re-read whenever that parent scrolls (via{' '}
            <code>observeScroll</code>).
          </>,
          <>
            <code>isScrollable(box, axis)</code> for each box: overflow style and real overflow
            both count.
          </>,
        ]}
      >
        <GeometryDemo />
      </Figure>
      <CodeTabs tabs={[{ label: 'Core', file: 'geometry.ts', code: CODE }]} />
    </Section>
  )
}

function GeometryDemo() {
  const [axis, setAxis] = useState<Axis>('y')
  const [probe, setProbe] = useState<ProbeId>('P3')
  const [parent, setParent] = useState<ScrollTarget | null>(null)
  const [scrollable, setScrollable] = useState<Record<ContainerId, Record<Axis, boolean>> | null>(null)
  const probes: Record<ProbeId, RefObject<HTMLButtonElement | null>> = {
    P1: useRef(null),
    P2: useRef(null),
    P3: useRef(null),
    P4: useRef(null),
  }
  const boxes: Record<ContainerId, RefObject<HTMLDivElement | null>> = {
    outer: useRef(null),
    strip: useRef(null),
    inner: useRef(null),
  }
  const specimen = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = probes[probe].current
    if (element) setParent(findScrollParent(element, axis))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probe, axis])

  useEffect(() => {
    const element = specimen.current
    if (!element) return
    const measure = () => {
      const next = {} as Record<ContainerId, Record<Axis, boolean>>
      for (const id of CONTAINERS) {
        const box = boxes[id].current
        next[id] = { x: box ? isScrollable(box, 'x') : false, y: box ? isScrollable(box, 'y') : false }
      }
      setScrollable(next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const metrics = useMetrics(parent)
  const parentName =
    parent === null ? '…' : parent === window ? 'window' : (CONTAINERS.find((id) => boxes[id].current === parent) ?? 'element')
  const isParent = (id: ContainerId) => parentName === id

  function probeButton(id: ProbeId) {
    return (
      <button
        ref={probes[id]}
        type="button"
        className="probe"
        aria-pressed={probe === id}
        onClick={() => setProbe(id)}
      >
        {id}
      </button>
    )
  }

  return (
    <div className="gm">
      <div ref={specimen} className={parentName === 'window' ? 'gm-specimen is-window' : 'gm-specimen'}>
        <div className="gm-row">
          {probeButton('P1')}
          <span className="gm-note">sheet · not a scroll box</span>
        </div>
        <div ref={boxes.outer} className={isParent('outer') ? 'gm-box gm-outer is-parent' : 'gm-box gm-outer'} tabIndex={0} aria-label="Outer box">
          <span className="gm-tag">outer · overflow-y: auto</span>
          <div className="gm-row">
            {probeButton('P2')}
            <span className="gm-note">directly in outer</span>
          </div>
          <div ref={boxes.strip} className={isParent('strip') ? 'gm-box gm-strip is-parent' : 'gm-box gm-strip'} tabIndex={0} aria-label="Sideways strip">
            <div className="gm-strip-inner">
              <span className="gm-tag">strip · overflow-x: auto</span>
              {probeButton('P3')}
              <span className="gm-note">→ 900 px wide</span>
            </div>
          </div>
          <div ref={boxes.inner} className={isParent('inner') ? 'gm-box gm-inner is-parent' : 'gm-box gm-inner'} tabIndex={0} aria-label="Inner box">
            <span className="gm-tag">inner · overflow-y: auto</span>
            <div className="gm-filler" />
            <div className="gm-row">
              {probeButton('P4')}
              <span className="gm-note">deep in inner</span>
            </div>
            <div className="gm-filler" />
          </div>
          <div className="gm-filler gm-filler-tall" />
        </div>
        {parentName === 'window' && <span className="gm-window-tag">parent = window</span>}
      </div>

      <div className="gm-report">
        <div className="gm-controls">
          <div className="field">
            <span className="field-label" id="gm-axis">axis</span>
            <div className="seg" role="group" aria-labelledby="gm-axis">
              {(['x', 'y'] as const).map((option) => (
                <button key={option} type="button" className="seg-btn" aria-pressed={axis === option} onClick={() => setAxis(option)}>
                  '{option}'
                </button>
              ))}
            </div>
          </div>
          <Callout n={2} lead="left" out style={{ top: 22, right: -34 }} />
        </div>
        <p className="gm-answer" aria-live="polite">
          <code>
            findScrollParent({probe}, '{axis}')
          </code>
          <span className="gm-arrow" aria-hidden="true">→</span>
          <strong>{parentName}</strong>
          <Callout n={1} lead="left" out style={{ top: 10, right: -34 }} />
        </p>
        <p className="gm-where">
          {probe}: {PROBES.find((item) => item.id === probe)?.where}
        </p>
        <div className="gm-metrics">
          <p className="gm-sub">readScroll({parentName})</p>
          <dl>
            {METRIC_KEYS.map((key) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{metrics ? formatInt(metrics[key]) : '—'}</dd>
              </div>
            ))}
          </dl>
          <Callout n={3} lead="left" out style={{ top: 4, right: -34 }} />
        </div>
        <div className="gm-scrollable">
          <table className="spec spec-compact">
            <caption className="gm-sub">isScrollable(box, axis)</caption>
            <thead>
              <tr>
                <th scope="col">box</th>
                <th scope="col">'x'</th>
                <th scope="col">'y'</th>
              </tr>
            </thead>
            <tbody>
              {CONTAINERS.map((id) => (
                <tr key={id}>
                  <th scope="row">{id}</th>
                  <td>{scrollable ? String(scrollable[id].x) : '…'}</td>
                  <td>{scrollable ? String(scrollable[id].y) : '…'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Callout n={4} lead="left" out style={{ top: 26, right: -34 }} />
        </div>
      </div>
    </div>
  )
}

function useMetrics(target: ScrollTarget | null) {
  const [metrics, setMetrics] = useState<ScrollMetrics | null>(null)
  useEffect(() => {
    if (!target) return
    return observeScroll(target, () => setMetrics(readScroll(target)))
  }, [target])
  return metrics
}
