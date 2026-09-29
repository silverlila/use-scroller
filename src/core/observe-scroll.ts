import { isWindow, readScroll, type ScrollMetrics } from './geometry'
import { EDGE_TOLERANCE, type ScrollTarget } from './types'

export interface ScrollState {
  x: number
  y: number
  minX: number
  maxX: number
  maxY: number
  progressX: number
  progressY: number
  atTop: boolean
  atBottom: boolean
  atLeft: boolean
  atRight: boolean
  canScrollX: boolean
  canScrollY: boolean
  directionX: Direction
  directionY: Direction
  velocityX: number
  velocityY: number
  isScrolling: boolean
}

type Direction = -1 | 0 | 1
type Motion = Pick<
  ScrollState,
  'directionX' | 'directionY' | 'velocityX' | 'velocityY' | 'isScrolling'
>
type Position = Omit<ScrollState, keyof Motion>
type Velocity = Pick<ScrollState, 'velocityX' | 'velocityY'>

const IDLE_MOTION: Motion = {
  directionX: 0,
  directionY: 0,
  velocityX: 0,
  velocityY: 0,
  isScrolling: false,
}

export const initialScrollState: ScrollState = {
  x: 0,
  y: 0,
  minX: 0,
  maxX: 0,
  maxY: 0,
  progressX: 0,
  progressY: 0,
  atTop: true,
  atBottom: true,
  atLeft: true,
  atRight: true,
  canScrollX: false,
  canScrollY: false,
  ...IDLE_MOTION,
}

// setTimeout treats longer delays as 0, which would end every scroll immediately.
const MAX_TIMEOUT_MS = 2_147_483_647

const STATE_KEYS = Object.keys(initialScrollState) as (keyof ScrollState)[]

export function observeScroll(
  target: ScrollTarget,
  listener: (state: ScrollState) => void,
  { idleDelay = 120 }: { idleDelay?: number } = {}
): () => void {
  if (!(idleDelay >= 0 && idleDelay <= MAX_TIMEOUT_MS)) {
    throw new RangeError(
      `observeScroll: idleDelay must be between 0 and ${MAX_TIMEOUT_MS} ms, got ${idleDelay}`
    )
  }
  let state: ScrollState = { ...describePosition(readScroll(target)), ...IDLE_MOTION }
  let sampledAt = performance.now()
  let scrolling = false
  let scrolledSinceUpdate = false
  let frame: number | null = null
  let idleTimer: ReturnType<typeof setTimeout> | undefined

  function update() {
    const now = performance.now()
    const metrics = readScroll(target)
    const next = nextState(state, metrics, scrolling, currentVelocity(metrics, now - sampledAt))
    sampledAt = now
    scrolledSinceUpdate = false
    if (sameState(state, next)) return
    state = next
    listener(state)
  }

  // A re-measure caused only by a size change says nothing about scroll speed.
  function currentVelocity(metrics: ScrollMetrics, elapsedMs: number): Velocity {
    if (!scrolling) return { velocityX: 0, velocityY: 0 }
    if (!scrolledSinceUpdate) return { velocityX: state.velocityX, velocityY: state.velocityY }
    return {
      velocityX: speed(metrics.x - state.x, elapsedMs),
      velocityY: speed(metrics.y - state.y, elapsedMs),
    }
  }

  function scheduleUpdate() {
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      update()
    })
  }

  function settle() {
    scrolling = false
    update()
  }

  function onScroll() {
    scrolling = true
    scrolledSinceUpdate = true
    clearTimeout(idleTimer)
    idleTimer = setTimeout(settle, idleDelay)
    scheduleUpdate()
  }

  target.addEventListener('scroll', onScroll, { passive: true })
  const stopWatchingSize = isWindow(target)
    ? watchWindowSize(target, scheduleUpdate)
    : watchElementSize(target, scheduleUpdate)
  listener(state)

  return () => {
    target.removeEventListener('scroll', onScroll)
    stopWatchingSize()
    if (frame !== null) cancelAnimationFrame(frame)
    clearTimeout(idleTimer)
  }
}

function describePosition(metrics: ScrollMetrics): Position {
  const { x, y, minX, maxX, maxY } = metrics
  const rangeX = maxX - minX
  return {
    x,
    y,
    minX,
    maxX,
    maxY,
    progressX: progress(x - minX, rangeX),
    progressY: progress(y, maxY),
    atTop: y <= EDGE_TOLERANCE,
    atBottom: y >= maxY - EDGE_TOLERANCE,
    atLeft: x <= minX + EDGE_TOLERANCE,
    atRight: x >= maxX - EDGE_TOLERANCE,
    canScrollX: rangeX > EDGE_TOLERANCE,
    canScrollY: maxY > EDGE_TOLERANCE,
  }
}

function progress(offset: number, range: number): number {
  if (range <= EDGE_TOLERANCE) return 0
  return Math.min(1, Math.max(0, offset / range))
}

function nextState(
  previous: ScrollState,
  metrics: ScrollMetrics,
  isScrolling: boolean,
  velocity: Velocity
): ScrollState {
  return {
    ...describePosition(metrics),
    directionX: directionOf(metrics.x - previous.x, previous.directionX),
    directionY: directionOf(metrics.y - previous.y, previous.directionY),
    ...velocity,
    isScrolling,
  }
}

function directionOf(delta: number, previous: Direction): Direction {
  if (delta > 0) return 1
  if (delta < 0) return -1
  return previous
}

function speed(delta: number, elapsedMs: number): number {
  return elapsedMs > 0 ? (delta / elapsedMs) * 1000 : 0
}

function sameState(a: ScrollState, b: ScrollState): boolean {
  return STATE_KEYS.every((key) => a[key] === b[key])
}

function watchElementSize(element: HTMLElement, onResize: () => void): () => void {
  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(element)
  for (const child of element.children) resizeObserver.observe(child)
  // Text directly inside the element has no box for the ResizeObserver, so its edits are watched
  // here. Deeper changes resize a child element, which the ResizeObserver already reports.
  const mutationObserver = new MutationObserver((records) => {
    let changed = false
    for (const record of records) {
      if (record.type === 'characterData') {
        if (record.target.parentNode === element) changed = true
        continue
      }
      if (record.target !== element) continue
      changed = true
      for (const node of record.addedNodes) {
        if (node instanceof Element) resizeObserver.observe(node)
      }
      for (const node of record.removedNodes) {
        if (node instanceof Element) resizeObserver.unobserve(node)
      }
    }
    if (changed) onResize()
  })
  mutationObserver.observe(element, { childList: true, subtree: true, characterData: true })
  return () => {
    resizeObserver.disconnect()
    mutationObserver.disconnect()
  }
}

function watchWindowSize(win: Window, onResize: () => void): () => void {
  const { documentElement, body } = win.document
  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(documentElement)
  resizeObserver.observe(body)
  win.addEventListener('resize', onResize)
  return () => {
    resizeObserver.disconnect()
    win.removeEventListener('resize', onResize)
  }
}
