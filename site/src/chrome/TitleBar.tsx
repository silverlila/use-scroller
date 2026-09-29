import { NPM_URL, REPO_URL } from '../site'

export function TitleBar() {
  return (
    <header className="titlebar">
      <p className="titlebar-id">
        <span className="titlebar-mark" aria-hidden="true" />
        <strong>use-scroller</strong>
      </p>
      <nav className="titlebar-links" aria-label="Project links">
        <a href={REPO_URL}>GitHub</a>
        <a href={NPM_URL}>npm</a>
      </nav>
    </header>
  )
}
