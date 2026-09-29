import { describe, expect, onTestFinished, test } from 'vitest'
import { lockScroll } from '../../src/core'
import {
  createBox,
  createScroller,
  inlineDeclarations,
  mount,
  mountPage,
  nextFrame,
  setInlineStyle,
} from '../helpers/dom'
import { dispatchTouch, swipe } from '../helpers/touch'

const fingerUp = { dy: -30 }
const fingerDown = { dy: 30 }
const fingerLeft = { dx: -30 }

function lock(options?: { allow?: HTMLElement[] }): () => void {
  const unlock = lockScroll(options)
  onTestFinished(unlock)
  return unlock
}

function isPageLocked(): boolean {
  return getComputedStyle(document.documentElement).overflowY === 'hidden'
}

function mountList(style: Partial<CSSStyleDeclaration> = {}): {
  list: HTMLDivElement
  item: Element
} {
  const list = mount(
    createScroller({ width: 100, height: 100 }, { width: 100, height: 400 }, style)
  )
  const item = list.firstElementChild
  if (!item) throw new Error('list has no content')
  return { list, item }
}

describe('lockScroll page styles', () => {
  test('hides root overflow while locked and restores it on unlock', () => {
    const unlock = lock()
    expect(isPageLocked()).toBe(true)

    unlock()

    expect(isPageLocked()).toBe(false)
  })

  test('restores the exact inline styles the page had before', () => {
    setInlineStyle(document.documentElement, 'overflow-y: scroll !important; color: red;')
    setInlineStyle(document.body, 'padding-right: 1rem; margin: 0px;')
    const unlock = lock()

    unlock()

    expect(inlineDeclarations(document.documentElement)).toEqual({
      'overflow-y': 'scroll !important',
      color: 'red',
    })
    expect(inlineDeclarations(document.body)).toEqual({
      'padding-right': '1rem',
      'margin-top': '0px',
      'margin-right': '0px',
      'margin-bottom': '0px',
      'margin-left': '0px',
    })
  })

  test('adds the vanished scrollbar width to the existing body padding', () => {
    setInlineStyle(document.body, 'padding-right: 7px;')
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    lock()

    expect(getComputedStyle(document.body).paddingRight).toBe(`${7 + scrollbarWidth}px`)
  })

  test('leaves body padding alone when the root reserves a stable scrollbar gutter', () => {
    setInlineStyle(document.documentElement, 'scrollbar-gutter: stable;')
    setInlineStyle(document.body, 'padding-right: 1rem;')

    lock()

    expect(inlineDeclarations(document.body)).toEqual({ 'padding-right': '1rem' })
  })

  test('keeps the page locked until the last of two locks releases', () => {
    setInlineStyle(document.documentElement, 'overflow-x: clip;')
    const unlockFirst = lock()
    const unlockSecond = lock()

    unlockFirst()
    expect(isPageLocked()).toBe(true)

    unlockSecond()
    expect(isPageLocked()).toBe(false)
    expect(inlineDeclarations(document.documentElement)).toEqual({ 'overflow-x': 'clip' })
  })

  test('ignores repeated calls to the same unlock', () => {
    const unlockFirst = lock()
    lock()

    unlockFirst()
    unlockFirst()

    expect(isPageLocked()).toBe(true)
  })

  test('leaves the page scroll position where it was across lock and unlock', async () => {
    mountPage({ width: 100, height: 3000 })
    window.scrollTo({ top: 500, behavior: 'instant' })

    const unlock = lock()
    await nextFrame()
    expect(window.scrollY).toBe(500)

    unlock()
    await nextFrame()
    expect(window.scrollY).toBe(500)
  })
})

describe('lockScroll allowed elements', () => {
  test('contains overscroll on allowed elements and restores their inline styles', () => {
    const { list } = mountList()
    setInlineStyle(list, 'overscroll-behavior-y: auto;')
    const unlock = lock({ allow: [list] })
    expect(getComputedStyle(list)).toMatchObject({
      overscrollBehaviorX: 'contain',
      overscrollBehaviorY: 'contain',
    })

    unlock()

    expect(inlineDeclarations(list)).toMatchObject({ 'overscroll-behavior-y': 'auto' })
    expect(inlineDeclarations(list)).not.toHaveProperty('overscroll-behavior-x')
  })

  test('keeps an element contained while any lock still allows it', () => {
    const { list } = mountList()
    const unlockFirst = lock({ allow: [list] })
    lock({ allow: [list] })

    unlockFirst()

    expect(getComputedStyle(list).overscrollBehaviorY).toBe('contain')
  })

  test('releases containment of elements only a released lock allowed', () => {
    const { list } = mountList()
    lock()
    const unlockAllowing = lock({ allow: [list] })

    unlockAllowing()

    expect(isPageLocked()).toBe(true)
    expect(getComputedStyle(list).overscrollBehaviorY).toBe('auto')
  })
})

describe('lockScroll touch guard', () => {
  test('cancels touch moves outside allowed elements', () => {
    const outside = mount(createBox({ width: 100, height: 100 }))
    const { list } = mountList()
    lock({ allow: [list] })

    expect(swipe(outside, fingerUp).defaultPrevented).toBe(true)
  })

  test('lets an allowed scroller with room scroll in both directions', () => {
    const { list, item } = mountList()
    list.scrollTop = 150
    lock({ allow: [list] })

    expect(swipe(item, fingerUp).defaultPrevented).toBe(false)
    expect(swipe(item, fingerDown).defaultPrevented).toBe(false)
  })

  test('cancels moves that would pull an allowed scroller past its top', () => {
    const { list, item } = mountList()
    lock({ allow: [list] })

    expect(swipe(item, fingerDown).defaultPrevented).toBe(true)
    expect(swipe(item, fingerUp).defaultPrevented).toBe(false)
  })

  test('cancels moves that would push an allowed scroller past its bottom', () => {
    const { list, item } = mountList()
    list.scrollTop = 300
    lock({ allow: [list] })

    expect(swipe(item, fingerUp).defaultPrevented).toBe(true)
    expect(swipe(item, fingerDown).defaultPrevented).toBe(false)
  })

  test('decides by the axis the finger mostly moves along', () => {
    const track = mount(
      createScroller(
        { width: 100, height: 100 },
        { width: 400, height: 100 },
        { overflowY: 'hidden' }
      )
    )
    track.scrollLeft = 150
    lock({ allow: [track] })

    expect(swipe(track, { dx: -30, dy: 10 }).defaultPrevented).toBe(false)
    expect(swipe(track, { dx: 10, dy: -30 }).defaultPrevented).toBe(true)
  })

  test('cancels moves inside an allowed element with nothing scrollable', () => {
    const panel = mount(createBox({ width: 100, height: 100 }))
    lock({ allow: [panel] })

    expect(swipe(panel, fingerUp).defaultPrevented).toBe(true)
  })

  test('only considers scrollers inside the allowed element', () => {
    const { list, item } = mountList()
    list.scrollTop = 150
    const panel = createBox({ width: 100, height: 100 })
    item.append(panel)
    lock({ allow: [panel] })

    expect(swipe(panel, fingerUp).defaultPrevented).toBe(true)
  })

  test('honours the allow lists of every active lock', () => {
    const first = mountList()
    const second = mountList()
    first.list.scrollTop = 150
    second.list.scrollTop = 150
    lock({ allow: [first.list] })
    const unlockSecond = lock({ allow: [second.list] })

    expect(swipe(first.item, fingerUp).defaultPrevented).toBe(false)
    expect(swipe(second.item, fingerUp).defaultPrevented).toBe(false)

    unlockSecond()

    expect(swipe(second.item, fingerUp).defaultPrevented).toBe(true)
  })

  test('respects an RTL scroller at its start edge', () => {
    const track = mount(
      createScroller(
        { width: 100, height: 100 },
        { width: 400, height: 100 },
        { overflowY: 'hidden', direction: 'rtl' }
      )
    )
    lock({ allow: [track] })

    expect(swipe(track, { dx: -30 }).defaultPrevented).toBe(true)
    expect(swipe(track, { dx: 30 }).defaultPrevented).toBe(false)
  })

  test('leaves two-finger pinch gestures alone', () => {
    const outside = mount(createBox({ width: 100, height: 100 }))
    lock()
    dispatchTouch('touchstart', outside, [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
    ])

    const move = dispatchTouch('touchmove', outside, [
      { x: 5, y: 5 },
      { x: 60, y: 60 },
    ])

    expect(move.defaultPrevented).toBe(false)
  })

  test('stops guarding touches once unlocked', () => {
    const outside = mount(createBox({ width: 100, height: 100 }))
    const unlock = lock()

    unlock()

    expect(swipe(outside, fingerLeft).defaultPrevented).toBe(false)
  })
})
