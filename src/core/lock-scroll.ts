import { isScrollable, readScroll } from './geometry'
import { setInlineStyles, type Restore } from './inline-style'
import { EDGE_TOLERANCE, type Axis } from './types'

interface Lock {
  allow: readonly HTMLElement[]
}

interface Point {
  x: number
  y: number
}

const activeLocks = new Set<Lock>()
const containedElements = new Map<HTMLElement, Restore>()
let unlockPage: Restore | null = null

export function lockScroll({ allow = [] }: { allow?: HTMLElement[] } = {}): () => void {
  const lock: Lock = { allow: [...allow] }
  if (activeLocks.size === 0) unlockPage = lockPage()
  activeLocks.add(lock)
  syncContainment()
  return () => {
    if (!activeLocks.delete(lock)) return
    syncContainment()
    if (activeLocks.size === 0) {
      unlockPage?.()
      unlockPage = null
    }
  }
}

function lockPage(): Restore {
  const { documentElement, body } = document
  const restoreBody = reservesScrollbarGutter(documentElement)
    ? noop
    : compensateScrollbar(documentElement, body)
  const restoreRoot = setInlineStyles(documentElement, {
    'overflow-x': 'hidden',
    'overflow-y': 'hidden',
  })
  const stopGuarding = guardTouchScroll()
  return () => {
    stopGuarding()
    restoreBody()
    restoreRoot()
  }
}

// A stable gutter stays reserved under overflow: hidden, so padding would count the scrollbar twice.
function reservesScrollbarGutter(root: HTMLElement): boolean {
  return getComputedStyle(root).getPropertyValue('scrollbar-gutter').includes('stable')
}

function compensateScrollbar(root: HTMLElement, body: HTMLElement): Restore {
  const scrollbarWidth = window.innerWidth - root.clientWidth
  const paddingRight = parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth
  return setInlineStyles(body, { 'padding-right': `${paddingRight}px` })
}

function noop() {
  // Nothing was changed, so there is nothing to restore.
}

function syncContainment(): void {
  const allowed = allowedElements()
  for (const [element, restore] of containedElements) {
    if (allowed.has(element)) continue
    restore()
    containedElements.delete(element)
  }
  for (const element of allowed) {
    if (containedElements.has(element)) continue
    containedElements.set(
      element,
      setInlineStyles(element, {
        'overscroll-behavior-x': 'contain',
        'overscroll-behavior-y': 'contain',
      })
    )
  }
}

function allowedElements(): Set<HTMLElement> {
  const allowed = new Set<HTMLElement>()
  for (const lock of activeLocks) {
    for (const element of lock.allow) allowed.add(element)
  }
  return allowed
}

// iOS Safari has long scrolled the page through overflow: hidden on the root, so touch gestures
// are cancelled unless they would scroll something inside an allowed element.
function guardTouchScroll(): Restore {
  let previous: Point | null = null

  function onTouchStart(event: TouchEvent) {
    previous = touchPoint(event)
  }

  function onTouchMove(event: TouchEvent) {
    const current = touchPoint(event)
    const delta =
      previous && current ? { x: previous.x - current.x, y: previous.y - current.y } : null
    previous = current
    // Two fingers are a pinch-zoom, which must keep working.
    if (event.touches.length > 1) return
    if (!delta || !canScrollInside(event.target, delta)) event.preventDefault()
  }

  document.addEventListener('touchstart', onTouchStart, { passive: true })
  // Chromium makes document-level touch listeners passive by default, which ignores preventDefault.
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  return () => {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove', onTouchMove)
  }
}

function touchPoint(event: TouchEvent): Point | null {
  const touch = event.touches[0]
  return touch ? { x: touch.clientX, y: touch.clientY } : null
}

function canScrollInside(target: EventTarget | null, delta: Point): boolean {
  if (!(target instanceof Element)) return false
  const boundary = outermostAllowedAncestor(target)
  if (!boundary) return false
  const axis: Axis = Math.abs(delta.x) > Math.abs(delta.y) ? 'x' : 'y'
  const scroller = nearestScroller(target, boundary, axis)
  return scroller !== null && canScrollToward(scroller, axis, delta[axis])
}

function outermostAllowedAncestor(target: Element): HTMLElement | null {
  const allowed = allowedElements()
  let outermost: HTMLElement | null = null
  for (let el: Element | null = target; el; el = el.parentElement) {
    if (el instanceof HTMLElement && allowed.has(el)) outermost = el
  }
  return outermost
}

function nearestScroller(target: Element, boundary: HTMLElement, axis: Axis): HTMLElement | null {
  for (let el: Element | null = target; el; el = el.parentElement) {
    if (el instanceof HTMLElement && isScrollable(el, axis)) return el
    if (el === boundary) return null
  }
  return null
}

function canScrollToward(scroller: HTMLElement, axis: Axis, delta: number): boolean {
  const { x, y, minX, maxX, maxY } = readScroll(scroller)
  const [position, min, max] = axis === 'x' ? [x, minX, maxX] : [y, 0, maxY]
  if (delta > 0) return position < max - EDGE_TOLERANCE
  if (delta < 0) return position > min + EDGE_TOLERANCE
  return false
}
