import { useEffect, useRef, useState } from 'react'
import { useInView, useScrollRestoration } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

const KEY = 'blueprint:register'
const STORAGE_KEY = `use-scroller:${KEY}`
const ROWS = Array.from({ length: 120 }, (_, index) => ({
  n: index + 1,
  title: ['Flange', 'Bearing housing', 'Drive shaft', 'Gear train', 'Bracket', 'Cover plate'][index % 6],
  rev: String.fromCharCode(65 + (index % 4)),
}))

const REACT_CODE = `import { useRef } from 'react'
import { useScrollRestoration } from 'use-scroller'

function Register() {
  const list = useRef<HTMLOListElement>(null)
  useScrollRestoration(list, 'register') // saved in sessionStorage by default
  return <ol ref={list} style={{ overflow: 'auto', height: 300 }}>…</ol>
}

// The whole page. This site does it: reload and you land where you were.
// Take pathname from your router, not \`location\`, so it renders on the server.
useScrollRestoration('window', \`page:\${pathname}\`)`

const CORE_CODE = `import { restoreScroll } from 'use-scroller/core'

const stop = restoreScroll(list, 'inbox', {
  storage: localStorage, // default: sessionStorage
  timeout: 5000,         // default: 3000 ms to wait for content to grow
})
stop() // saves once more, then stops`

export function RestoreSection() {
  return (
    <Section
      id="restoration"
      kicker="Coming back · React hook + core"
      signature="useScrollRestoration(ref | 'window', key, { storage?, timeout? })"
    >
      <p className="lede">
        Saves a scroll position under a key and puts it back on the next mount: after a reload, or
        when the user returns to a route. If the content is not tall enough yet, it waits for it to
        grow, and any wheel, touch or key press during the wait cancels the restore.
      </p>
      <Figure
        n="10"
        title="Drawing register that remembers where you were"
        legend={[
          <>
            The list calls <code>useScrollRestoration(list, '{KEY}')</code>. Scroll it somewhere.
          </>,
          <>
            Remount unmounts the list for a moment and mounts a fresh one. The position comes back.
            Reload does the same across a page load.
          </>,
          <>
            What is stored: JSON under <code>use-scroller:&lt;key&gt;</code>, saved on scroll (once
            per frame at most), on <code>pagehide</code> and on cleanup.
          </>,
        ]}
      >
        <RestoreDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Register.tsx', code: REACT_CODE },
          { label: 'Core', file: 'register.ts', code: CORE_CODE },
        ]}
      />
      <p className="fine">
        With the default <code>sessionStorage</code> it survives reloads and back/forward in the
        same tab, not a new tab. It saves one position per key, so put the route or item id in the
        key. For <code>window</code> it sets <code>history.scrollRestoration = 'manual'</code> while
        active. Blocked storage means no restore and no error. Use it or your router’s restoration
        for the window, not both.
      </p>
    </Section>
  )
}

function RestoreDemo() {
  const [mounted, setMounted] = useState(true)
  const [mounts, setMounts] = useState(1)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function remount() {
    setMounted(false)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setMounted(true)
      setMounts((value) => value + 1)
    }, 700)
  }

  return (
    <div className="rs">
      <div className="rs-list-wrap">
        {mounted ? (
          <Register />
        ) : (
          <div className="rs-empty" role="status">
            &lt;Register /&gt; unmounted
          </div>
        )}
        <Callout n={1} lead="none" style={{ top: -11, right: 16 }} />
      </div>
      <div className="rs-side">
        <p className="rs-mounts">
          mount <strong>#{mounts}</strong>
        </p>
        <div className="rs-actions">
          <button type="button" className="btn btn-dark" onClick={remount} disabled={!mounted}>
            Remount list
          </button>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <Callout n={2} lead="left" out style={{ top: 9, right: -34 }} />
        </div>
        <StorageReadout />
      </div>
    </div>
  )
}

function Register() {
  const list = useRef<HTMLOListElement>(null)
  useScrollRestoration(list, KEY)
  return (
    <ol ref={list} className="rs-list scroll-box" tabIndex={0} aria-label="Drawing register">
      {ROWS.map((row) => (
        <li key={row.n}>
          <span className="rs-n">DWG {String(row.n).padStart(3, '0')}</span>
          <span className="rs-title">{row.title}</span>
          <span className="rs-rev">rev {row.rev}</span>
        </li>
      ))}
    </ol>
  )
}

function StorageReadout() {
  const ref = useRef<HTMLDivElement>(null)
  const { inView } = useInView(ref)
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    if (!inView) return
    const read = () => {
      try {
        setValue(sessionStorage.getItem(STORAGE_KEY))
      } catch {
        setValue(null)
      }
    }
    read()
    const interval = setInterval(read, 200)
    return () => clearInterval(interval)
  }, [inView])

  return (
    <div ref={ref} className="rs-store">
      <p className="rs-store-head">sessionStorage</p>
      <p className="rs-store-key">{STORAGE_KEY}</p>
      <p className="rs-store-value">{value ?? 'null'}</p>
      <Callout n={3} lead="left" out style={{ top: 8, right: -34 }} />
    </div>
  )
}
