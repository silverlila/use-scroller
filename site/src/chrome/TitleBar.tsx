import { NPM_URL, REPO_URL } from '../site'
import { LAST_SHEET, VERSION } from '../meta'

export function TitleBar() {
  return (
    <header className="titlebar">
      <p className="titlebar-id">
        <span className="titlebar-mark" aria-hidden="true" />
        <span>
          <strong>use-scroller</strong> <span className="titlebar-dim">/ general arrangement</span>
        </span>
      </p>
      <p className="titlebar-meta" aria-hidden="true">
        <span>DWG US-{VERSION}</span>
        <span>Scale 1:1</span>
        <span>Sheets 00–{LAST_SHEET}</span>
      </p>
      <nav className="titlebar-links" aria-label="Project links">
        <a href={REPO_URL}>GitHub</a>
        <a href={NPM_URL}>npm</a>
      </nav>
    </header>
  )
}
