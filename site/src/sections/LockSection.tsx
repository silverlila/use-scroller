import { useRef, useState } from 'react'
import { useScrollLock } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section } from '../parts/Drawing'

const ITEMS = Array.from({ length: 40 }, (_, index) => ({
  n: index + 1,
  name: ['Bearing', 'Hex nut', 'Spring', 'Gear', 'Bracket', 'Shaft', 'Pulley', 'Washer'][index % 8],
  qty: ((index * 7) % 12) + 1,
}))

const REACT_CODE = `import { useRef, useState } from 'react'
import { useScrollLock } from 'use-scroller'

function PartsDialog() {
  const [open, setOpen] = useState(false)
  const list = useRef<HTMLUListElement>(null)
  useScrollLock(open, { allow: [list] }) // the page is locked; list still scrolls

  return (
    <dialog open={open} onClose={() => setOpen(false)}>
      <ul ref={list} style={{ overflow: 'auto', maxHeight: '60dvh' }}>…</ul>
    </dialog>
  )
}`

const CORE_CODE = `import { lockScroll } from 'use-scroller/core'

const unlock = lockScroll({ allow: [modalList] })
// …
unlock() // locks are reference-counted: the page frees when the last one unlocks`

export function LockSection() {
  return (
    <Section
      id="scroll-lock"
      kicker="Modals and sheets · React hook + core"
      signature="useScrollLock(active, { allow?: RefObject[] })"
    >
      <p className="lede">
        Locks page scrolling while <code>active</code> is true. Elements in <code>allow</code> stay
        scrollable and never chain to the page. On iOS Safari, where <code>overflow: hidden</code>{' '}
        alone does not stop the page, it adds a touch guard.
      </p>
      <Figure
        n="07"
        title="A modal parts list over a locked page"
        legend={[
          <>
            Opening the dialog sets <code>useScrollLock(open, …)</code> to true. Try to scroll the
            page behind it: it stays put, even when you touch the backdrop.
          </>,
          <>
            The list is in <code>allow</code>, so it scrolls, and reaching its end does not chain to
            the page.
          </>,
          <>
            The scrollbar’s width is added as body padding, so the layout does not shift, and the
            page keeps its scroll position.
          </>,
        ]}
      >
        <LockDemo />
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'PartsDialog.tsx', code: REACT_CODE },
          { label: 'Core', file: 'modal.ts', code: CORE_CODE },
        ]}
      />
      <p className="fine">
        Locks are reference-counted, so nested modals work. The iOS part of the lock still needs
        verification on a real device.
      </p>
    </Section>
  )
}

function LockDemo() {
  const dialog = useRef<HTMLDialogElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  useScrollLock(open, { allow: [list] })

  function openDialog() {
    dialog.current?.showModal()
    setOpen(true)
  }

  return (
    <div className="lk">
      <div className="lk-page" aria-hidden="true">
        <span className="lk-page-bar" />
        <span className="lk-page-bar short" />
        <span className="lk-page-bar" />
        <span className={open ? 'lk-page-lock is-on' : 'lk-page-lock'}>{open ? 'page locked' : 'page free'}</span>
      </div>
      <div className="lk-side">
        <p className="lk-state">
          page scroll: <strong>{open ? 'locked' : 'free'}</strong>
        </p>
        <button type="button" className="btn btn-dark" onClick={openDialog}>
          Open parts list
        </button>
        <Callout n={1} lead="left" out style={{ bottom: 9, right: -34 }} />
      </div>
      <dialog
        ref={dialog}
        className="lk-dialog"
        aria-labelledby="lk-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close()
        }}
      >
        <div className="lk-dialog-head">
          <div>
            <p className="kicker">Sheet 07 · modal</p>
            <h3 id="lk-title" className="lk-dialog-title">
              Parts list <span>{ITEMS.length} lines</span>
            </h3>
          </div>
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        <div className="lk-list-wrap">
          <ul ref={list} className="lk-list" tabIndex={0} aria-label="Parts">
            {ITEMS.map((item) => (
              <li key={item.n}>
                <span className="lk-n">{String(item.n).padStart(2, '0')}</span>
                <span className="lk-name">{item.name}</span>
                <span className="lk-qty">× {item.qty}</span>
              </li>
            ))}
          </ul>
          <Callout n={2} lead="none" style={{ top: -11, right: 20 }} />
        </div>
        <p className="lk-foot">
          Scroll the list to its end, then keep going: the page behind does not move. Esc closes.
        </p>
      </dialog>
    </div>
  )
}
