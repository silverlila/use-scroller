import { EDGE_TOLERANCE, type Axis, type ScrollTarget } from './types'

export interface ScrollMetrics {
  x: number
  y: number
  minX: number
  maxX: number
  maxY: number
  viewportWidth: number
  viewportHeight: number
}

const SCROLLABLE_OVERFLOW = ['auto', 'scroll', 'overlay']

export function isWindow(target: ScrollTarget): target is Window {
  return 'scrollY' in target
}

export function readScroll(target: ScrollTarget): ScrollMetrics {
  if (isWindow(target)) return readWindowScroll(target)
  return readElementScroll(target)
}

function readWindowScroll(win: Window): ScrollMetrics {
  const root = win.document.documentElement
  const viewportWidth = root.clientWidth
  const viewportHeight = hasClassicScrollbar(win) ? root.clientHeight : win.innerHeight
  return {
    x: win.scrollX,
    y: win.scrollY,
    ...horizontalRange(root, Math.max(0, root.scrollWidth - viewportWidth)),
    maxY: Math.max(0, root.scrollHeight - viewportHeight),
    viewportWidth,
    viewportHeight,
  }
}

// A scrollbar that takes layout space means desktop, where innerHeight would include a horizontal
// scrollbar. Elsewhere innerHeight is right: it tracks mobile toolbar collapse, clientHeight doesn't.
function hasClassicScrollbar(win: Window): boolean {
  return win.innerWidth > win.document.documentElement.clientWidth
}

function readElementScroll(element: HTMLElement): ScrollMetrics {
  return {
    x: element.scrollLeft,
    y: element.scrollTop,
    ...horizontalRange(element, element.scrollWidth - element.clientWidth),
    maxY: element.scrollHeight - element.clientHeight,
    viewportWidth: element.clientWidth,
    viewportHeight: element.clientHeight,
  }
}

// In RTL, scrollLeft starts at 0 and goes negative as content scrolls into view.
function horizontalRange(element: Element, max: number): { minX: number; maxX: number } {
  if (getComputedStyle(element).direction === 'rtl') return { minX: -max, maxX: 0 }
  return { minX: 0, maxX: max }
}

export function writeScroll(target: ScrollTarget, position: { x?: number; y?: number }): void {
  // 'instant' so CSS `scroll-behavior: smooth` can't turn each write into a native animation.
  target.scrollTo({ left: position.x, top: position.y, behavior: 'instant' })
}

export function isScrollable(element: HTMLElement, axis: Axis): boolean {
  const style = getComputedStyle(element)
  const overflow = axis === 'x' ? style.overflowX : style.overflowY
  if (!SCROLLABLE_OVERFLOW.includes(overflow)) return false
  const overflowAmount =
    axis === 'x'
      ? element.scrollWidth - element.clientWidth
      : element.scrollHeight - element.clientHeight
  return overflowAmount > EDGE_TOLERANCE
}

export function findScrollParent(element: HTMLElement, axis: Axis): ScrollTarget {
  // The root element's scrolling belongs to the window, which is also where its scroll events fire.
  const root = element.ownerDocument.documentElement
  for (let el = element.parentElement; el && el !== root; el = el.parentElement) {
    if (isScrollable(el, axis)) return el
  }
  return window
}
