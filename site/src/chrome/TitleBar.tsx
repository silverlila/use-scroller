import { NPM_URL, REPO_URL } from '../site'

export function TitleBar() {
  return (
    <header className="titlebar">
      <p className="titlebar-id">
        <svg className="titlebar-logo" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 3v18" stroke="currentColor" />
          <rect x="17.5" y="6" width="2.25" height="6.5" rx="0.75" fill="currentColor" />
          <path d="M6.5 8.5h6M6.5 12h6M6.5 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <strong>use-scroller</strong>
      </p>
      <nav className="titlebar-links" aria-label="Project links">
        <a href={REPO_URL}>GitHub</a>
        <a href={NPM_URL}>npm</a>
      </nav>
    </header>
  )
}
