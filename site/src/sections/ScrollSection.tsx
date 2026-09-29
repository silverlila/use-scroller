import { useRef, useState, type RefObject } from 'react'
import {
  easings,
  useScroll,
  useScrollState,
  type ScrollAnimation,
  type ScrollHandle,
  type ScrollResult,
  type ScrollState,
} from 'use-scroller'
import { formatInt } from '../hooks'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, DimV, Figure, Section, Spec } from '../parts/Drawing'

type Kind = 'tween' | 'spring' | 'instant'

const ANIMATIONS: Record<Kind, ScrollAnimation> = {
  tween: { type: 'tween' },
  spring: { type: 'spring' },
  instant: { type: 'instant' },
}
const SLOW: ScrollAnimation = { type: 'tween', duration: 6000, easing: easings.linear }
const TARGET_ROW = 30
const ROWS = Array.from({ length: 60 }, (_, index) => index + 1)
const RESULTS: ScrollResult[] = ['completed', 'interrupted', 'cancelled']
const selectY = (state: ScrollState) => state.y
const selectAtBottom = (state: ScrollState) => state.atBottom

const REACT_CODE = `import { useRef } from 'react'
import { useScroll } from 'use-scroller'

function Rows() {
  const list = useRef<HTMLOListElement>(null)
  const row30 = useRef<HTMLLIElement>(null)
  const { scrollTo, scrollBy, scrollToEdge, scrollToElement, cancel } =
    useScroll(list, { animation: { type: 'spring' } }) // defaults for every call

  async function toBottom() {
    const result = await scrollToEdge('bottom').finished
    if (result === 'interrupted') console.log('Stopped where you grabbed it')
  }

  return (
    <>
      <button onClick={toBottom}>Bottom</button>
      <button onClick={() => scrollToElement(row30, { align: 'center' })}>Row 30</button>
      <button onClick={() => scrollBy({ y: 200 })}>+200px</button>
      <button onClick={() => scrollTo({ y: 0 }, { animation: { type: 'instant' } })}>Top</button>
      <button onClick={cancel}>Cancel</button>
      <ol ref={list} style={{ overflow: 'auto', height: 320 }}>…</ol>
    </>
  )
}

// The page itself: this site's index does exactly this
const page = useScroll('window')
page.scrollToElement(section, { align: 'start', offset: 64 }) // 64px sticky header`

const CORE_CODE = `import { scrollToEdge, scrollToElement, scrollBy, cancelScroll } from 'use-scroller/core'

const handle = scrollToEdge(list, 'bottom') // 'top' | 'bottom' | 'left' | 'right'
scrollToElement(window, heading, { align: 'center', offset: 64 })
scrollBy(list, { y: 200 }) // repeated calls add up while an animation runs

cancelScroll(list)      // stops whatever runs on list
handle.cancel()         // or stop one handle
await handle.finished   // 'completed' | 'interrupted' | 'cancelled'`

export function ScrollSection() {
  return (
    <Section
      id="use-scroll"
      kicker="Animated scrolling · React hook + core"
      signature="useScroll(ref | 'window', options?) → { scrollTo, scrollBy, scrollToEdge, scrollToElement, cancel }"
    >
      <p className="lede">
        Scroll a container or the page to an edge, an element or an offset, with an animation
        that gives way to the user. Every action returns a <code>ScrollHandle</code>:{' '}
        <code>{'{ finished, cancel() }'}</code>, where <code>finished</code> resolves to how it
        ended.
      </p>
      <Figure
        n="02"
        title="Programmatic scrolling and the three ways it can end"
        legend={[
          <>
            Actions from <code>useScroll(list, {'{ animation }'})</code>. The hook options are
            defaults; each call can override them.
          </>,
          <>
            <code>scrollToElement(row30, {'{ align: "center" }'})</code> targets the hatched row.
          </>,
          <>
            The plate shows what <code>await handle.finished</code> returned. Start the slow scroll
            and wheel, touch or press a key on the list to get <code>interrupted</code>; press
            Cancel to get <code>cancelled</code>.
          </>,
        ]}
      >
        <ScrollDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Rows.tsx', code: REACT_CODE },
          { label: 'Core', file: 'rows.ts', code: CORE_CODE },
        ]}
      />
      <Spec
        head={['Action', 'Does']}
        rows={[
          [<code>scrollTo({'{ x, y }'})</code>, 'Animates to a position. A missing axis does not move.'],
          [<code>scrollBy({'{ x, y }'})</code>, 'Relative to where a running animation is heading, so repeated calls add up.'],
          [<code>scrollToEdge(edge)</code>, "'top' | 'bottom' | 'left' | 'right'; left and right respect RTL."],
          [<code>scrollToElement(el, {'{ align, offset }'})</code>, "align: 'start' | 'center' | 'end' | 'nearest'. offset leaves room for a sticky header."],
          [<code>cancel()</code>, 'Stops the running animation; its handle resolves to cancelled.'],
        ]}
      />
      <p className="fine">
        Actions have stable identities and throw if the ref is not attached (<code>cancel()</code>{' '}
        does nothing then). A new animation on the same target cancels the previous one;
        unmounting cancels a running one.
      </p>
    </Section>
  )
}

function ScrollDemo() {
  const [kind, setKind] = useState<Kind>('tween')
  const [result, setResult] = useState<ScrollResult | 'running' | null>(null)
  const list = useRef<HTMLOListElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const latest = useRef<ScrollHandle | null>(null)
  const { scrollToEdge, scrollToElement, scrollBy, cancel } = useScroll(list, {
    animation: ANIMATIONS[kind],
  })
  const atBottom = useScrollState(list, selectAtBottom)

  function report(handle: ScrollHandle) {
    latest.current = handle
    setResult('running')
    void handle.finished.then((outcome) => {
      if (latest.current === handle) setResult(outcome)
    })
  }

  return (
    <div className="sd">
      <div className="sd-controls">
        <div className="field">
          <span className="field-label" id="sd-anim">
            animation.type
          </span>
          <div className="seg" role="group" aria-labelledby="sd-anim">
            {(['tween', 'spring', 'instant'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className="seg-btn"
                aria-pressed={kind === option}
                onClick={() => setKind(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="btn-grid">
          <button type="button" className="btn" onClick={() => report(scrollToEdge('top'))}>
            scrollToEdge('top')
          </button>
          <button type="button" className="btn" onClick={() => report(scrollToEdge('bottom'))}>
            scrollToEdge('bottom')
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => report(scrollToElement(row, { align: 'center' }))}
          >
            scrollToElement(row30)
          </button>
          <button type="button" className="btn" onClick={() => report(scrollBy({ y: 200 }))}>
            scrollBy({'{ y: 200 }'})
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => report(scrollToEdge(atBottom ? 'top' : 'bottom', { animation: SLOW }))}
          >
            Slow 6 s run · try to stop it
          </button>
          <button type="button" className="btn" onClick={cancel}>
            cancel()
          </button>
        </div>
        <Callout n={1} lead="left" style={{ top: 27, left: 204 }} />
        <div className="plate" aria-live="polite">
          <p className="plate-label">handle.finished</p>
          <ul className="plate-states">
            {RESULTS.map((option) => (
              <li key={option} className={result === option ? 'is-on' : undefined}>
                {option}
              </li>
            ))}
          </ul>
          <p className="plate-now">
            {result === 'running' ? 'running…' : result ? `→ '${result}'` : 'no animation yet'}
          </p>
          <Callout n={3} lead="left" out style={{ top: 8, right: -34 }} />
        </div>
      </div>
      <div className="sd-list-wrap">
        <ol ref={list} className="sd-list scroll-box" tabIndex={0} aria-label="Sixty rows">
          {ROWS.map((n) => (
            <li
              key={n}
              ref={n === TARGET_ROW ? row : undefined}
              className={n === TARGET_ROW ? 'sd-row is-target' : 'sd-row'}
            >
              <span className="sd-row-n">{String(n).padStart(2, '0')}</span>
              <span>{n === TARGET_ROW ? 'Row 30 · target' : `Row ${n}`}</span>
              {n === TARGET_ROW && <Callout n={2} lead="left" style={{ top: 9, right: 12 }} />}
            </li>
          ))}
        </ol>
        <ListY list={list} />
      </div>
    </div>
  )
}

function ListY({ list }: { list: RefObject<HTMLOListElement | null> }) {
  const y = useScrollState(list, selectY)
  return <DimV label={`y ${formatInt(y)}`} />
}
