import { useScroll } from 'use-scroller'
import { CodeBlock } from '../CodeBlock'
import { INSTALL, NPM_URL, PACKAGE, REPO_URL } from '../site'
import { LAST_SHEET, VERSION } from '../meta'

export function Footer() {
  const page = useScroll('window')
  return (
    <footer className="footer">
      <div className="footer-lead">
        <p className="kicker">End of drawing set</p>
        <p className="footer-title">You have read every sheet. Time to build.</p>
      </div>
      <div className="titleblock">
        <div className="tb-cell tb-install">
          <span className="tb-label">Install</span>
          <CodeBlock code={INSTALL} className="code-install" />
        </div>
        <div className="tb-cell tb-project">
          <span className="tb-label">Project</span>
          <span className="tb-value tb-big">{PACKAGE}</span>
        </div>
        <div className="tb-cell">
          <span className="tb-label">Rev</span>
          <span className="tb-value">{VERSION}</span>
        </div>
        <div className="tb-cell">
          <span className="tb-label">License</span>
          <span className="tb-value">MIT</span>
        </div>
        <div className="tb-cell">
          <span className="tb-label">Sheets</span>
          <span className="tb-value">00 – {LAST_SHEET}</span>
        </div>
        <div className="tb-cell tb-wide">
          <span className="tb-label">Entry points</span>
          <span className="tb-value">
            <code>use-scroller</code> · <code>use-scroller/core</code>
          </span>
        </div>
        <div className="tb-cell">
          <span className="tb-label">Requires</span>
          <span className="tb-value">React 18 / 19 · optional</span>
        </div>
        <div className="tb-cell">
          <span className="tb-label">Source</span>
          <a className="tb-link" href={REPO_URL}>
            GitHub ↗
          </a>
        </div>
        <div className="tb-cell">
          <span className="tb-label">Registry</span>
          <a className="tb-link" href={NPM_URL}>
            npm ↗
          </a>
        </div>
        <div className="tb-cell tb-return">
          <span className="tb-label">Return</span>
          <button type="button" className="tb-link tb-top" onClick={() => page.scrollToEdge('top')}>
            ↑ scrollToEdge('top')
          </button>
        </div>
      </div>
      <p className="footer-fine">
        Drawn with use-scroller itself: the ruler, readout, index and every figure on this page
        use the library. Scale 1 : 1. All dimensions in CSS pixels.
      </p>
    </footer>
  )
}
