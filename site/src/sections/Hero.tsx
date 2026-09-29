import { useRef } from 'react'
import { CodeBlock } from '../CodeBlock'
import { INSTALL } from '../site'
import { useElementSize } from '../hooks'
import { DimH } from '../parts/Drawing'
import { VERSION } from '../meta'

const FIXES = [
  {
    title: 'Swipe tracks that drift',
    body: 'A slightly diagonal swipe on a carousel moves the page, the carousel, or both. dragScroll decides once per gesture and sticks to one axis.',
  },
  {
    title: 'Modal scroll bleed on iOS',
    body: 'overflow: hidden on the page does not stop iOS Safari from scrolling it behind a modal. lockScroll adds a touch guard and keeps the modal’s own list scrollable.',
  },
  {
    title: 'Animations that fight the user',
    body: 'animateScroll stops the moment the user touches, wheels or presses a key, pauses CSS scroll snapping while it runs, and respects reduced motion.',
  },
]

export function Hero() {
  const word = useRef<HTMLSpanElement>(null)
  const { width } = useElementSize(word)

  return (
    <section id="install" className="sec sec-hero" aria-labelledby="install-title">
      <div className="sec-margin" aria-hidden="true">
        <span className="sec-num">00</span>
      </div>
      <div className="sec-body">
        <p className="kicker">Scroll utilities for the web · React hooks on top</p>
        <div className="h1-wrap">
          <h1 id="install-title" tabIndex={-1}>
            <span ref={word} className="h1-word">
              use-scroller
            </span>
          </h1>
          {width > 0 && (
            <div className="h1-dim-row" style={{ width }}>
              <DimH label={`${Math.round(width)} px`} />
            </div>
          )}
        </div>
        <p className="hero-lede">
          Native scrolling stays in charge. The library steps in only where the platform falls
          short. This page is a drawing set: read it top to bottom and every sheet explains one
          export, shows a live figure built with it, and gives you the code.
        </p>

        <div className="install">
          <p className="install-step">
            <span className="step-tag">Step 01</span> Install from npm
          </p>
          <CodeBlock code={INSTALL} className="code-install" />
          <ul className="facts" aria-label="Package facts">
            <li>v{VERSION}</li>
            <li>MIT</li>
            <li>ESM + types</li>
            <li>React 18 / 19, optional</li>
            <li>Safe to import during SSR</li>
          </ul>
        </div>

        <h3 className="h3">What it fixes</h3>
        <ol className="fixes">
          {FIXES.map((fix, index) => (
            <li key={fix.title} className="fix">
              <span className="fix-no" aria-hidden="true">
                {String.fromCharCode(65 + index)}
              </span>
              <p className="fix-title">{fix.title}</p>
              <p className="fix-body">{fix.body}</p>
            </li>
          ))}
        </ol>
        <p className="fixes-also">
          Also: scroll state (edges, progress, direction, velocity), scroll spy, in-view detection,
          scroll restoration, and sticking to the bottom of a chat or log.
        </p>

        <h3 className="h3">How to read this drawing</h3>
        <ul className="symbols">
          <li>
            <span className="sym sym-fig" aria-hidden="true">
              FIG.
            </span>
            <span>
              A <strong>figure</strong> is a live demo built with the export named on the sheet.
            </span>
          </li>
          <li>
            <span className="sym" aria-hidden="true">
              <span className="callout callout-inline">1</span>
            </span>
            <span>
              A <strong>callout</strong> points at a part of the figure; the legend below it says
              what that part does.
            </span>
          </li>
          <li>
            <span className="sym sym-dim" aria-hidden="true">
              <DimH label="px" />
            </span>
            <span>
              A <strong>dimension</strong> is measured live, in CSS pixels.
            </span>
          </li>
          <li>
            <span className="sym sym-ruler" aria-hidden="true" />
            <span>
              The <strong>ruler</strong> on the edge of your screen (a strip along the top on
              phones) measures this page as you scroll. It is <code>useScrollState('window')</code>.
            </span>
          </li>
        </ul>
      </div>
    </section>
  )
}
