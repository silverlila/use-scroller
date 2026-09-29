import { useEffect, useRef, useState } from 'react'
import { useScrollSpy, useScrollState } from 'use-scroller'
import { formatInt, useGoToSection } from '../hooks'
import { SECTIONS, SECTION_IDS } from '../meta'
import { Index } from './Index'

export function Strip({ spyOffset }: { spyOffset: number }) {
  const active = useScrollSpy(SECTION_IDS, { offset: spyOffset })
  const [open, setOpen] = useState(false)
  const goTo = useGoToSection()
  const panel = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const section = SECTIONS[active]

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node
      if (!panel.current?.contains(target) && !toggle.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className="strip">
      <div className="strip-row">
        <button
          ref={toggle}
          type="button"
          className="strip-toggle"
          aria-expanded={open}
          aria-controls="strip-index"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="strip-num">{section ? section.num : '--'}</span>
          <span className="strip-title">{section ? section.title : 'Index'}</span>
          <span className="strip-caret" aria-hidden="true">
            {open ? '▴' : '▾'}
          </span>
        </button>
        <StripReadout />
      </div>
      <StripScale />
      {open && (
        <nav ref={panel} id="strip-index" className="strip-panel" aria-label="Sections">
          <p className="strip-panel-head">Drawing index</p>
          <Index
            active={active}
            onSelect={(id) => {
              goTo(id)
              setOpen(false)
            }}
          />
        </nav>
      )}
    </div>
  )
}

function StripReadout() {
  const state = useScrollState('window')
  const arrow = state.directionY === 1 ? '↓' : state.directionY === -1 ? '↑' : '·'
  return (
    <p className="strip-readout" aria-hidden="true">
      <span className={state.isScrolling ? 'led is-on' : 'led'} aria-hidden="true" />
      <span>y {formatInt(state.y)}</span>
      <span aria-hidden="true">{arrow}</span>
      <span>{formatInt(Math.abs(state.velocityY))}/s</span>
      <span>{Math.round(state.progressY * 100)}%</span>
    </p>
  )
}

const selectProgress = (state: { progressY: number }) => state.progressY

function StripScale() {
  const progress = useScrollState('window', selectProgress)
  return (
    <div className="strip-scale" aria-hidden="true">
      <span className="strip-fill" style={{ transform: `scaleX(${progress})` }} />
      <span className="strip-marker" style={{ left: `${progress * 100}%` }} />
    </div>
  )
}
