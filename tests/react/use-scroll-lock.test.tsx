import { StrictMode, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, onTestFinished, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { lockScroll, useScrollLock } from '../../src/react'
import { inlineDeclarations, setInlineStyle } from '../helpers/dom'
import { swipe } from '../helpers/touch'

const viewport = { width: 100, height: 100, overflow: 'auto', scrollbarWidth: 'none' } as const
const fingerUp = { dy: -30 }

function isPageLocked(): boolean {
  return getComputedStyle(document.documentElement).overflowY === 'hidden'
}

function Lock({ active }: { active: boolean }) {
  useScrollLock(active)
  return null
}

function Modal({ active = true }: { active?: boolean }) {
  const list = useRef<HTMLDivElement>(null)
  useScrollLock(active, { allow: [list] })
  return (
    <div ref={list} aria-label="list" style={viewport}>
      <div style={{ height: 400 }} />
    </div>
  )
}

function scrolledToMiddle(list: Element): Element {
  list.scrollTop = 150
  const item = list.firstElementChild
  if (!item) throw new Error('list has no content')
  return item
}

describe('useScrollLock', () => {
  test('locks the page while active and unlocks when it turns inactive', async () => {
    const screen = await render(<Lock active />)
    expect(isPageLocked()).toBe(true)

    await screen.rerender(<Lock active={false} />)

    expect(isPageLocked()).toBe(false)
  })

  test('does not lock while inactive', async () => {
    await render(<Lock active={false} />)

    expect(isPageLocked()).toBe(false)
  })

  test('unlocks when unmounted', async () => {
    const screen = await render(<Lock active />, { wrapper: StrictMode })
    expect(isPageLocked()).toBe(true)

    await screen.unmount()

    expect(isPageLocked()).toBe(false)
  })

  test('restores the original inline styles only when the last lock releases', async () => {
    setInlineStyle(document.documentElement, 'overflow-y: scroll; color: red;')
    function Locks({ first, second }: { first: boolean; second: boolean }) {
      useScrollLock(first)
      useScrollLock(second)
      return null
    }
    const unlockCore = lockScroll()
    onTestFinished(unlockCore)
    const screen = await render(<Locks first second />)

    unlockCore()
    await screen.rerender(<Locks first={false} second />)
    expect(isPageLocked()).toBe(true)

    await screen.rerender(<Locks first={false} second={false} />)
    expect(inlineDeclarations(document.documentElement)).toEqual({
      'overflow-y': 'scroll',
      color: 'red',
    })
  })

  test('lets an allowed element scroll while cancelling touches elsewhere', async () => {
    const screen = await render(<Modal />)
    const item = scrolledToMiddle(screen.getByLabelText('list').element())

    expect(swipe(item, fingerUp).defaultPrevented).toBe(false)
    expect(swipe(document.body, fingerUp).defaultPrevented).toBe(true)
  })

  test('applies a changed allow list without unlocking the page', async () => {
    function TwoLists({ allowed }: { allowed: 'first' | 'second' }) {
      const first = useRef<HTMLDivElement>(null)
      const second = useRef<HTMLDivElement>(null)
      useScrollLock(true, { allow: [allowed === 'first' ? first : second] })
      return (
        <>
          <div ref={first} aria-label="first" style={viewport}>
            <div style={{ height: 400 }} />
          </div>
          <div ref={second} aria-label="second" style={viewport}>
            <div style={{ height: 400 }} />
          </div>
        </>
      )
    }
    const screen = await render(<TwoLists allowed="first" />)
    const firstList = screen.getByLabelText('first').element()
    const secondList = screen.getByLabelText('second').element()
    const firstItem = scrolledToMiddle(firstList)
    const secondItem = scrolledToMiddle(secondList)
    const rootStyleChanges: MutationRecord[] = []
    const observer = new MutationObserver((records) => rootStyleChanges.push(...records))
    observer.observe(document.documentElement, { attributeFilter: ['style'] })
    onTestFinished(() => observer.disconnect())

    await screen.rerender(<TwoLists allowed="second" />)

    rootStyleChanges.push(...observer.takeRecords())
    expect(rootStyleChanges).toEqual([])
    expect(isPageLocked()).toBe(true)
    expect(swipe(secondItem, fingerUp).defaultPrevented).toBe(false)
    expect(swipe(firstItem, fingerUp).defaultPrevented).toBe(true)
    expect(getComputedStyle(secondList).overscrollBehaviorY).toBe('contain')
    expect(getComputedStyle(firstList).overscrollBehaviorY).toBe('auto')
  })

  test('allows an element that renders after the lock became active', async () => {
    function LateModal({ open }: { open: boolean }) {
      const list = useRef<HTMLDivElement>(null)
      useScrollLock(true, { allow: [list] })
      return open ? (
        <div ref={list} aria-label="list" style={viewport}>
          <div style={{ height: 400 }} />
        </div>
      ) : null
    }
    const screen = await render(<LateModal open={false} />)

    await screen.rerender(<LateModal open />)

    const item = scrolledToMiddle(screen.getByLabelText('list').element())
    expect(swipe(item, fingerUp).defaultPrevented).toBe(false)
  })

  test('does nothing on the server', () => {
    const html = renderToString(<Modal />)

    expect(html).toContain('aria-label="list"')
    expect(isPageLocked()).toBe(false)
  })
})
