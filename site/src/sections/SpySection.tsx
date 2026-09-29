import { createRef, useMemo, useRef, useState } from 'react'
import { useScroll, useScrollSpy } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

const CHAPTERS = [
  { title: 'General notes', lines: 5 },
  { title: 'Materials', lines: 8 },
  { title: 'Tolerances', lines: 4 },
  { title: 'Surface finish', lines: 7 },
  { title: 'Inspection', lines: 6 },
]

const REACT_CODE = `import { useRef } from 'react'
import { useScrollSpy } from 'use-scroller'

// Sections are refs or element ids. -1 means "before the first one".
const active = useScrollSpy(['intro', 'install', apiRef], { offset: 64 })

// Inside a scroll container instead of the window:
const box = useRef<HTMLDivElement>(null)
const activeInBox = useScrollSpy(chapterRefs, { root: box, offset: 40 })`

const CORE_CODE = `import { observeActiveSection } from 'use-scroller/core'

// The readout in this page's margin uses it directly:
const stop = observeActiveSection(sections, (index) => highlight(index), {
  root: window,
  offset: 140,
})`

export function SpySection() {
  return (
    <Section
      id="scroll-spy"
      kicker="Table of contents · React hook + core"
      signature="useScrollSpy(sections, { root?, offset? }) → index"
    >
      <p className="lede">
        Returns the index of the section at the reading line, or −1 before the first one.{' '}
        <code>offset</code> moves the reading line down from the root’s top edge, usually by a
        sticky header’s height. The drawing index on this page is a <code>useScrollSpy</code> over
        the window.
      </p>
      <Figure
        n="08"
        title="Chapter spy inside a box, with a movable reading line"
        legend={[
          <>
            <code>useScrollSpy(chapters, {'{ root: box, offset }'})</code>. The highlighted entry
            is the returned index.
          </>,
          <>
            The reading line sits <code>offset</code> px below the box’s top. A chapter becomes
            active when its top crosses it.
          </>,
          <>
            Clicking an entry calls <code>scrollToElement(chapter, {'{ offset }'})</code> from{' '}
            <code>useScroll(box)</code>, landing each chapter on the line.
          </>,
        ]}
      >
        <SpyDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Toc.tsx', code: REACT_CODE },
          { label: 'Core', file: 'toc.ts', code: CORE_CODE },
        ]}
      />
      <p className="fine">
        A missing id throws. Once the root is scrolled to the end, the last section is active even
        if a short last section never reached the reading line.
      </p>
    </Section>
  )
}

function SpyDemo() {
  const box = useRef<HTMLDivElement>(null)
  const chapters = useMemo(() => CHAPTERS.map(() => createRef<HTMLElement>()), [])
  const [offset, setOffset] = useState(48)
  const active = useScrollSpy(chapters, { root: box, offset })
  const { scrollToElement } = useScroll(box)

  return (
    <div className="sp">
      <div className="sp-side">
        <nav aria-label="Chapters" className="sp-nav-wrap">
          <ol className="sp-nav">
            {CHAPTERS.map((chapter, index) => (
              <li key={chapter.title}>
                <button
                  type="button"
                  className="sp-link"
                  aria-current={index === active ? 'true' : undefined}
                  onClick={() => scrollToElement(chapters[index], { align: 'start', offset })}
                >
                  <span className="sp-link-n">{String.fromCharCode(65 + index)}</span>
                  {chapter.title}
                </button>
              </li>
            ))}
          </ol>
          <Callout n={3} lead="down" style={{ top: -30, left: 8 }} />
        </nav>
        <p className="sp-index">
          active = <strong>{active}</strong>
          <Callout n={1} lead="left" out style={{ top: 0, right: -44 }} />
        </p>
        <label className="range">
          <span className="range-head">
            <span className="field-label">offset</span>
            <output className="range-value">{offset} px</output>
          </span>
          <input type="range" min={0} max={160} step={4} value={offset} onChange={(event) => setOffset(Number(event.target.value))} />
        </label>
      </div>
      <div className="sp-box-wrap">
        <div ref={box} className="sp-box scroll-box" tabIndex={0} aria-label="Specification chapters">
          {CHAPTERS.map((chapter, index) => (
            <section
              key={chapter.title}
              ref={chapters[index]}
              className={index === active ? 'sp-chapter is-active' : 'sp-chapter'}
              aria-label={chapter.title}
            >
              <p className="sp-chapter-head">
                <span>{String.fromCharCode(65 + index)}</span> {chapter.title}
              </p>
              {Array.from({ length: chapter.lines }, (_, line) => (
                <span key={line} className="sp-bar" style={{ width: `${55 + ((line * 29 + index * 13) % 40)}%` }} />
              ))}
            </section>
          ))}
          <div className="sp-tail">End of specification</div>
        </div>
        <div className="sp-line" style={{ transform: `translateY(${offset}px)` }} aria-hidden="true">
          <span>reading line · offset {offset}</span>
        </div>
        <Callout n={2} lead="left" out style={{ top: offset - 11, right: -34 }} />
      </div>
    </div>
  )
}
