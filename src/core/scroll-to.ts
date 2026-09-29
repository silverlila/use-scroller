import {
  animateScroll,
  scrollDestination,
  type AnimateScrollOptions,
  type ScrollDestination,
  type ScrollHandle,
} from './animate-scroll'
import { isWindow, readScroll } from './geometry'
import type { ScrollTarget } from './types'

export type Edge = 'top' | 'bottom' | 'left' | 'right'
export type ScrollAlign = 'start' | 'center' | 'end' | 'nearest'

export interface ScrollToElementOptions extends AnimateScrollOptions {
  align?: ScrollAlign
  offset?: number
}

interface AxisPlacement {
  elementStart: number
  elementSize: number
  viewportSize: number
  scroll: number
  inset: number
}

// Infinite targets clamp to the current range every frame, so the edge is still reached if the
// content grows mid-animation, and RTL's negative horizontal range needs no special case.
const EDGE_DESTINATIONS: Record<Edge, ScrollDestination> = {
  top: { y: -Infinity },
  bottom: { y: Infinity },
  left: { x: -Infinity },
  right: { x: Infinity },
}

export function scrollToEdge(
  target: ScrollTarget,
  edge: Edge,
  options?: AnimateScrollOptions
): ScrollHandle {
  return animateScroll(target, EDGE_DESTINATIONS[edge], options)
}

export function scrollBy(
  target: ScrollTarget,
  delta: ScrollDestination,
  options?: AnimateScrollOptions
): ScrollHandle {
  const base = scrollDestination(target)
  return animateScroll(
    target,
    {
      x: delta.x === undefined ? undefined : base.x + delta.x,
      y: delta.y === undefined ? undefined : base.y + delta.y,
    },
    options
  )
}

export function scrollToElement(
  target: ScrollTarget,
  element: HTMLElement,
  options: ScrollToElementOptions = {}
): ScrollHandle {
  if (!isWindow(target) && !target.contains(element)) {
    throw new Error('scrollToElement: element is not inside the scroll target')
  }
  const { align = 'start', offset = 0, ...animateOptions } = options
  const metrics = readScroll(target)
  const viewport = viewportOrigin(target)
  const rect = element.getBoundingClientRect()
  const x = placeOnAxis(align, {
    elementStart: rect.left - viewport.left,
    elementSize: rect.width,
    viewportSize: metrics.viewportWidth,
    scroll: metrics.x,
    inset: 0,
  })
  const y = placeOnAxis(align, {
    elementStart: rect.top - viewport.top,
    elementSize: rect.height,
    viewportSize: metrics.viewportHeight,
    scroll: metrics.y,
    inset: offset,
  })
  return animateScroll(target, { x, y }, animateOptions)
}

export function viewportOrigin(target: ScrollTarget): { left: number; top: number } {
  if (isWindow(target)) return { left: 0, top: 0 }
  const rect = target.getBoundingClientRect()
  return { left: rect.left + target.clientLeft, top: rect.top + target.clientTop }
}

// `inset` is covered viewport at the start (a fixed header), so the visible region is [inset, viewportSize].
function placeOnAxis(align: ScrollAlign, placement: AxisPlacement): number | undefined {
  const { elementStart, elementSize, viewportSize, scroll, inset } = placement
  const start = scroll + elementStart - inset
  const end = scroll + elementStart + elementSize - viewportSize
  switch (align) {
    case 'start':
      return start
    case 'end':
      return end
    case 'center':
      return scroll + elementStart + elementSize / 2 - (inset + viewportSize) / 2
    case 'nearest': {
      const fullyVisible = elementStart >= inset && elementStart + elementSize <= viewportSize
      if (fullyVisible) return undefined
      return Math.abs(start - scroll) <= Math.abs(end - scroll) ? start : end
    }
    default: {
      const exhaustive: never = align
      throw new Error(`scrollToElement: unknown align ${String(exhaustive)}`)
    }
  }
}
