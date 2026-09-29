import { clampToRange } from './animate-scroll'
import { readScroll } from './geometry'
import { EDGE_TOLERANCE, type Axis } from './types'

const FLICK_VELOCITY = 300

type Alignment = 'start' | 'center' | 'end'

interface Span {
  start: number
  end: number
}

interface Scrollport extends Span {
  size: number
}

export function readSnapPositions(container: HTMLElement, axis: Axis): number[] {
  const containerStyle = getComputedStyle(container)
  if (containerStyle.scrollSnapType === 'none') return []
  const rightToLeft = axis === 'x' && containerStyle.direction === 'rtl'
  const port = scrollport(container, axis)
  const origin = contentOrigin(container, axis)
  const metrics = readScroll(container)
  const positions = new Set<number>()
  for (const [child, style] of snapAreaCandidates(container)) {
    const logical = snapAlignment(style.scrollSnapAlign, axis)
    if (logical === null) continue
    const alignment = rightToLeft ? mirrored(logical) : logical
    const area = snapArea(child, style, origin, axis)
    positions.add(clampToRange(metrics, axis, alignedPosition(area, port, alignment)))
  }
  return [...positions].sort((a, b) => a - b)
}

// A nested snap container owns the snap areas inside it, though it can itself snap in this one.
function* snapAreaCandidates(root: Element): Generator<[Element, CSSStyleDeclaration]> {
  for (const child of root.children) {
    const style = getComputedStyle(child)
    yield [child, style]
    if (style.scrollSnapType === 'none') yield* snapAreaCandidates(child)
  }
}

export function pickSnapTarget(
  positions: number[],
  current: number,
  projected: number,
  velocity: number
): number {
  if (positions.length === 0) throw new RangeError('pickSnapTarget: positions must not be empty')
  const nearest = positions.reduce((best, position) =>
    Math.abs(position - projected) < Math.abs(best - projected) ? position : best
  )
  if (Math.abs(velocity) < FLICK_VELOCITY) return nearest
  const direction = Math.sign(velocity)
  const isAhead = (position: number) => (position - current) * direction > EDGE_TOLERANCE
  if (isAhead(nearest)) return nearest
  const ahead = positions.filter(isAhead)
  if (ahead.length === 0) return nearest
  return direction > 0 ? ahead[0] : ahead[ahead.length - 1]
}

// scroll-snap-align lists the block axis first, then the inline axis (x in horizontal writing).
function snapAlignment(value: string, axis: Axis): Alignment | null {
  const [block, inline = block] = value.split(' ')
  const keyword = axis === 'x' ? inline : block
  if (keyword === 'start' || keyword === 'center' || keyword === 'end') return keyword
  return null
}

// Right to left, the inline start is the right edge.
function mirrored(alignment: Alignment): Alignment {
  if (alignment === 'start') return 'end'
  if (alignment === 'end') return 'start'
  return alignment
}

function scrollport(container: HTMLElement, axis: Axis): Scrollport {
  const style = getComputedStyle(container)
  const size = axis === 'x' ? container.clientWidth : container.clientHeight
  const [paddingStart, paddingEnd] =
    axis === 'x'
      ? [style.scrollPaddingLeft, style.scrollPaddingRight]
      : [style.scrollPaddingTop, style.scrollPaddingBottom]
  return { start: resolvePadding(paddingStart, size), end: resolvePadding(paddingEnd, size), size }
}

function resolvePadding(value: string, size: number): number {
  if (value === 'auto') return 0
  if (value.endsWith('%')) return (parseFloat(value) / 100) * size
  return parseFloat(value)
}

// Where scroll position 0 of the content sits, in viewport coordinates.
function contentOrigin(container: HTMLElement, axis: Axis): number {
  const box = container.getBoundingClientRect()
  if (axis === 'x') return box.left + container.clientLeft - container.scrollLeft
  return box.top + container.clientTop - container.scrollTop
}

function snapArea(child: Element, style: CSSStyleDeclaration, origin: number, axis: Axis): Span {
  const box = child.getBoundingClientRect()
  if (axis === 'x') {
    return {
      start: box.left - parseFloat(style.scrollMarginLeft) - origin,
      end: box.right + parseFloat(style.scrollMarginRight) - origin,
    }
  }
  return {
    start: box.top - parseFloat(style.scrollMarginTop) - origin,
    end: box.bottom + parseFloat(style.scrollMarginBottom) - origin,
  }
}

function alignedPosition(area: Span, port: Scrollport, alignment: Alignment): number {
  switch (alignment) {
    case 'start':
      return area.start - port.start
    case 'end':
      return area.end - (port.size - port.end)
    case 'center':
      return (area.start + area.end) / 2 - (port.start + (port.size - port.start - port.end) / 2)
    default: {
      const exhaustive: never = alignment
      return exhaustive
    }
  }
}
