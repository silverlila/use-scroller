import { useEffect, useRef, useState, type RefObject } from 'react'
import { useInView } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

const THRESHOLDS = Array.from({ length: 11 }, (_, index) => index / 10)
const FIRST_PAGE = 6
const PAGE = 4
const MAX = 22

const SHAPES = [
  'M20 70 L50 20 L80 70 Z',
  'M20 45 A30 30 0 1 0 80 45 A30 30 0 1 0 20 45',
  'M20 20 H80 V70 H20 Z M35 35 H65 V55 H35 Z',
  'M15 45 L30 20 H70 L85 45 L70 70 H30 Z',
  'M20 70 V35 L50 15 L80 35 V70 Z M42 70 V50 H58 V70',
  'M15 45 C30 5 70 5 85 45 C70 85 30 85 15 45 Z',
]

const REACT_CODE = `import { useRef } from 'react'
import { useInView } from 'use-scroller'

function Specimen() {
  const ref = useRef<HTMLDivElement>(null)
  const { inView, entry } = useInView(ref, { threshold: 0.6, once: true })
  return <div ref={ref} className={inView ? 'plotted' : 'blank'}>…</div>
}

// Inside a scroll container, pass it as root
const { entry } = useInView(ref, { root: box, threshold: [0, 0.5, 1] })
const ratio = entry?.intersectionRatio ?? 0`

const RECIPE_CODE = `// Infinite scroll: load the next page when a sentinel after the last item
// comes within 120px of the box.
function Feed() {
  const { items, hasMore, loading, loadMore } = useFeed()
  const sentinel = useRef<HTMLDivElement>(null)
  const { inView } = useInView(sentinel, { root: box, rootMargin: '0px 0px 120px 0px' })

  useEffect(() => {
    if (inView && hasMore && !loading) loadMore()
  }, [inView, hasMore, loading, loadMore])

  return (
    <>
      {items.map((item) => <Card key={item.id} item={item} />)}
      {hasMore && <div ref={sentinel} />}
    </>
  )
}`

export function InViewSection() {
  return (
    <Section
      id="in-view"
      kicker="Visibility · React hook"
      signature="useInView(ref, { root?, rootMargin?, threshold?, once? }) → { inView, entry }"
    >
      <p className="lede">
        Tells a component whether its element is visible, with the raw{' '}
        <code>IntersectionObserverEntry</code> for anything finer. With <code>once</code>,{' '}
        <code>inView</code> stays true after the first intersection. Everything inside the box
        below reacts to the box, not the page.
      </p>
      <Figure
        n="09"
        title="Specimens plotted on sight, plus a sentinel that loads more"
        legend={[
          <>
            Each specimen has <code>useInView(ref, {'{ root: box, threshold: 0.6, once }'})</code>.
            At 60 % visible its outline is plotted.
          </>,
          <>
            A second <code>useInView</code> with 11 thresholds reads{' '}
            <code>entry.intersectionRatio</code> into the meter.
          </>,
          <>
            The sentinel: <code>rootMargin: '0px 0px 120px 0px'</code> loads the next page before you
            reach the end.
          </>,
        ]}
      >
        <InViewDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Specimen.tsx', code: REACT_CODE },
          { label: 'Recipe', file: 'Feed.tsx', code: RECIPE_CODE },
        ]}
      />
    </Section>
  )
}

function InViewDemo() {
  const [once, setOnce] = useState(true)
  const [run, setRun] = useState(0)
  return (
    <div className="iv">
      <div className="iv-bar">
        <label className="check">
          <input type="checkbox" checked={once} onChange={(event) => { setOnce(event.target.checked); setRun((value) => value + 1) }} />
          <span>once</span>
        </label>
        <button type="button" className="btn" onClick={() => setRun((value) => value + 1)}>
          Reset specimens
        </button>
      </div>
      <SpecimenBox key={run} once={once} />
    </div>
  )
}

function SpecimenBox({ once }: { once: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(FIRST_PAGE)
  const [loading, setLoading] = useState(false)
  const { inView: near } = useInView(sentinel, { root: box, rootMargin: '0px 0px 120px 0px' })
  const hasMore = count < MAX

  useEffect(() => {
    if (near && hasMore && !loading) setLoading(true)
  }, [near, hasMore, loading])

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => {
      setCount((current) => Math.min(MAX, current + PAGE))
      setLoading(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [loading])

  return (
    <div className="iv-box-wrap">
      <div ref={box} className="iv-box scroll-box" tabIndex={0} aria-label="Specimens">
        <p className="iv-hint">Scroll inside this box ↓ · specimens plot at 60 % visible</p>
        <div className="iv-grid">
          {Array.from({ length: count }, (_, index) => (
            <Specimen key={index} index={index} root={box} once={once} />
          ))}
        </div>
        {hasMore ? (
          <div ref={sentinel} className="iv-sentinel">
            {loading ? 'Loading 4 more…' : 'sentinel'}
            <Callout n={3} lead="left" style={{ top: 6, right: 8 }} />
          </div>
        ) : (
          <p className="iv-end">All {MAX} specimens loaded.</p>
        )}
      </div>
      <p className="iv-count">
        {count} / {MAX} loaded
      </p>
    </div>
  )
}

function Specimen({ index, root, once }: { index: number; root: RefObject<HTMLDivElement | null>; once: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { inView } = useInView(ref, { root, threshold: 0.6, once })
  const { entry } = useInView(ref, { root, threshold: THRESHOLDS })
  const ratio = entry?.isIntersecting ? entry.intersectionRatio : 0
  return (
    <div ref={ref} className={inView ? 'iv-item is-in' : 'iv-item'}>
      <svg viewBox="0 0 100 90" className="iv-shape" aria-hidden="true">
        <path d={SHAPES[index % SHAPES.length]} pathLength={1} />
      </svg>
      <p className="iv-name">S-{String(index + 1).padStart(2, '0')}</p>
      <div className="iv-meter" aria-hidden="true">
        <span style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <p className="iv-flag">
        <span>{(ratio * 100).toFixed(0)}%</span>
        <span>{inView ? 'inView' : '—'}</span>
      </p>
      {index === 0 && <Callout n={1} lead="down" style={{ top: 6, left: 6 }} />}
      {index === 1 && <Callout n={2} lead="up" style={{ bottom: 34, right: 6 }} />}
    </div>
  )
}
