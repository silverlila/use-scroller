import { useRef } from 'react'
import { useScrollState, type ScrollState } from 'use-scroller'
import { useElementSize, formatInt } from '../hooks'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, DimV, Figure, Section, Spec } from '../parts/Drawing'

const selectY = (state: ScrollState) => state.y
const selectMaxY = (state: ScrollState) => state.maxY
const DIAGRAM = 240
const LINES = Array.from({ length: 22 }, (_, index) => ({
  n: index + 1,
  width: 38 + ((index * 37) % 55),
  heading: index % 7 === 0,
}))

const CLEANUP = `import { observeScroll, lockScroll } from 'use-scroller/core'

const stop = observeScroll(list, (state) => render(state))
const unlock = lockScroll({ allow: [modalList] })

// later: every setup hands back its own undo
stop()
unlock()`

const TARGETS = `import { useRef } from 'react'
import { useScrollState } from 'use-scroller'

type ScrollTarget = HTMLElement | Window

function Panel() {
  const ref = useRef<HTMLDivElement>(null)
  const list = useScrollState(ref)        // an element, through a ref
  const page = useScrollState('window')   // or the window
  // …
}`

export function Concepts() {
  return (
    <Section id="concepts" kicker="Before the first hook · three rules">
      <p className="lede">
        Three rules hold for everything on the following sheets. Learn them once and the rest of
        the API reads the same way.
      </p>

      <div className="rules">
        <div className="rule">
          <p className="rule-no">Rule A</p>
          <h3 className="rule-title">Two entry points</h3>
          <Spec
            head={['Import', 'Contains', 'React']}
            rows={[
              [<code>use-scroller</code>, 'Hooks plus everything from core', '18 or 19'],
              [<code>use-scroller/core</code>, 'Framework-free functions', 'Not needed'],
            ]}
          />
          <p className="rule-body">
            React is an optional peer dependency, so core works in any framework or none. Both
            entries are ESM-only with types and safe to import during server rendering.
          </p>
        </div>
        <div className="rule">
          <p className="rule-no">Rule B</p>
          <h3 className="rule-title">A target is an element or the window</h3>
          <p className="rule-body">
            <code>ScrollTarget = HTMLElement | Window</code>. Core functions take the element (or{' '}
            <code>window</code>) itself. Hooks take a ref, or the string <code>'window'</code>.
          </p>
        </div>
        <div className="rule">
          <p className="rule-no">Rule C</p>
          <h3 className="rule-title">Every setup returns a cleanup</h3>
          <p className="rule-body">
            Anything that subscribes, locks or observes returns a function that undoes it. Hooks
            call it for you on unmount.
          </p>
        </div>
      </div>

      <Figure
        n="01"
        title="Anatomy of a scroll target, measured live"
        legend={[
          <>
            The scroll container. Scroll it: <code>y</code> is how far the content has moved up.
          </>,
          <>
            <code>viewportHeight</code> is the visible part; the dashed outline is the whole
            content.
          </>,
          <>
            <code>maxY</code> = content height − <code>viewportHeight</code>. At <code>y === maxY</code>{' '}
            you are at the bottom and <code>progressY</code> is 1.
          </>,
        ]}
      >
        <Anatomy />
      </Figure>

      <CodeTabs
        tabs={[
          { label: 'Targets', file: 'Panel.tsx', code: TARGETS },
          { label: 'Cleanup', file: 'setup.ts', code: CLEANUP },
        ]}
      />
    </Section>
  )
}

function Anatomy() {
  const box = useRef<HTMLDivElement>(null)
  const y = useScrollState(box, selectY)
  const maxY = useScrollState(box, selectMaxY)
  const { height } = useElementSize(box)
  const content = Math.max(maxY + height, 1)
  const scale = DIAGRAM / content
  const progress = maxY > 0 ? y / maxY : 0

  return (
    <div className="anatomy">
      <div className="anatomy-specimen">
        <div
          ref={box}
          className="anatomy-box scroll-box"
          tabIndex={0}
          aria-label="Specimen scroll container"
        >
          {LINES.map((line) => (
            <p key={line.n} className={line.heading ? 'spec-line is-heading' : 'spec-line'}>
              <span className="spec-line-n">{String(line.n).padStart(2, '0')}</span>
              <span className="spec-line-bar" style={{ width: `${line.width}%` }} />
            </p>
          ))}
        </div>
        <Callout n={1} lead="down" style={{ top: -30, left: 24 }} />
        <DimV label={`${formatInt(height)} px`} />
      </div>

      <div className="anatomy-diagram" aria-hidden="true">
        <div className="ad-stage" style={{ height: DIAGRAM }}>
          <div className="ad-content" />
          <div
            className="ad-viewport"
            style={{ transform: `translateY(${y * scale}px)`, height: height * scale }}
          >
            <span>viewport</span>
          </div>
          <span className="ad-dim ad-dim-y" style={{ height: y * scale }}>
            <span>y</span>
          </span>
          <span className="ad-dim ad-dim-max" style={{ height: maxY * scale }}>
            <span>maxY</span>
          </span>
          <Callout n={2} lead="left" out style={{ top: y * scale + (height * scale) / 2 - 11, right: -34 }} />
          <Callout n={3} lead="left" out style={{ top: maxY * scale - 11, right: -64 }} />
        </div>
      </div>

      <dl className="anatomy-values">
        <div>
          <dt>y</dt>
          <dd>{formatInt(y)}</dd>
        </div>
        <div>
          <dt>maxY</dt>
          <dd>{formatInt(maxY)}</dd>
        </div>
        <div>
          <dt>viewportHeight</dt>
          <dd>{formatInt(height)}</dd>
        </div>
        <div>
          <dt>progressY</dt>
          <dd>{progress.toFixed(3)}</dd>
        </div>
      </dl>
    </div>
  )
}
