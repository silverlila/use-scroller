import { cancelScroll, clampToRange } from './animate-scroll'
import { fling } from './fling'
import { findScrollParent, readScroll, writeScroll, type ScrollMetrics } from './geometry'
import { setInlineStyles } from './inline-style'
import { EDGE_TOLERANCE, type Axis, type ScrollTarget } from './types'
import { recordSample, releaseVelocity, type Sample } from './velocity'

export interface ScrollHandoffOptions {
  axis?: Axis
  parent?: ScrollTarget
}

interface Point {
  x: number
  y: number
}

interface Handoff {
  parent: ScrollTarget
  origin: number
  goal: number
}

interface BrowserScroll {
  inner: number
  direction: number
}

interface Pending {
  kind: 'pending'
  finger: Point
  time: number
}

interface Following {
  kind: 'following'
  finger: Point
  browserScroll: BrowserScroll | null
  travel: number
  samples: Sample[]
  owned: boolean
  handoff: Handoff | null
}

type Gesture = Pending | Following

const LINE_HEIGHT_PX = 16

export function scrollHandoff(
  inner: HTMLElement,
  { axis = 'y', parent }: ScrollHandoffOptions = {}
): () => void {
  const restoreOverscroll = setInlineStyles(inner, { [`overscroll-behavior-${axis}`]: 'none' })
  let gesture: Gesture | null = null
  let innerAfterWheel = position(inner, axis)

  function resolveParent(): ScrollTarget {
    return parent ?? findScrollParent(inner, axis)
  }

  function onWheel(event: WheelEvent) {
    // Trackpad pinch-zoom arrives as a wheel event with ctrlKey set.
    if (event.ctrlKey) return
    const metrics = readScroll(inner)
    const delta = wheelDelta(event, metrics)
    const step = delta[axis]
    // Later events of a wheel gesture can't be cancelled and may be read before the browser has
    // applied the ones before them, so count from where the browser will have put the list.
    const from = event.cancelable ? metrics[axis] : innerAfterWheel
    const to = clampToRange(metrics, axis, from + step)
    innerAfterWheel = to
    const overflow = from + step - to
    if (overflow === 0 || !isAlongAxis(delta, axis)) return
    if (event.cancelable) {
      event.preventDefault()
      writeScroll(inner, axis === 'x' ? { x: to } : { y: to })
    }
    const target = resolveParent()
    cancelScroll(target)
    scrollAlong(target, axis, overflow)
  }

  function onTouchStart(event: TouchEvent) {
    const finger = soleTouch(event)
    gesture = finger ? { kind: 'pending', finger, time: event.timeStamp } : null
  }

  function onTouchMove(event: TouchEvent) {
    const finger = soleTouch(event)
    if (!gesture || !finger) {
      gesture = null
      return
    }
    const delta = { x: gesture.finger.x - finger.x, y: gesture.finger.y - finger.y }
    if (gesture.kind === 'pending') {
      if (!isAlongAxis(delta, axis)) {
        gesture = null
        return
      }
      gesture = follow(gesture)
    }
    const step = delta[axis]
    gesture.finger = finger
    gesture.travel += step
    recordSample(gesture.samples, { time: event.timeStamp, position: gesture.travel })
    if (event.cancelable) ownStep(gesture, event, step)
    else if (step !== 0) followNativeStep(gesture, step)
  }

  function follow({ finger, time }: Pending): Following {
    return {
      kind: 'following',
      finger,
      browserScroll: null,
      travel: 0,
      samples: [{ time, position: 0 }],
      owned: false,
      handoff: null,
    }
  }

  // A cancelable move has not scrolled anything yet. Once one is cancelled, a native scroll that
  // starts later latches to whatever is under the finger by then, so we keep the whole gesture.
  function ownStep(following: Following, event: TouchEvent, step: number) {
    const room = roomToward(readScroll(inner), axis, step)
    const share = ownedParentShare(step, room, drivenDistance(following.handoff))
    if (share === 0 && !following.owned) return
    following.owned = true
    event.preventDefault()
    scrollAlong(inner, axis, step - share)
    if (share !== 0) driveParent(following, share)
    if (Math.abs(drivenDistance(following.handoff)) < EDGE_TOLERANCE) following.handoff = null
  }

  // Once the browser is scrolling the inner element its moves can't be cancelled, and they reach us
  // late or merged, so the list's position read here lags the finger. The browser moves the list
  // one to one with the finger, though, so we read it once per direction of travel and count on.
  function followNativeStep(following: Following, step: number) {
    const metrics = readScroll(inner)
    const tracked = following.browserScroll
    if (tracked?.direction !== Math.sign(step)) {
      following.browserScroll = { inner: metrics[axis], direction: Math.sign(step) }
      following.handoff = null
      return
    }
    const to = clampToRange(metrics, axis, tracked.inner + step)
    const overflow = tracked.inner + step - to
    tracked.inner = to
    if (overflow !== 0) driveParent(following, overflow)
  }

  function driveParent(following: Following, share: number) {
    following.handoff ??= startHandoff()
    const handoff = following.handoff
    cancelScroll(handoff.parent)
    handoff.goal = clampToRange(readScroll(handoff.parent), axis, handoff.goal + share)
    writeScroll(handoff.parent, axis === 'x' ? { x: handoff.goal } : { y: handoff.goal })
  }

  function startHandoff(): Handoff {
    const target = resolveParent()
    const origin = position(target, axis)
    return { parent: target, origin, goal: origin }
  }

  function onTouchEnd(event: TouchEvent) {
    const ended = gesture
    gesture = null
    if (ended?.kind !== 'following') return
    const moving = ended.handoff?.parent ?? (ended.owned ? inner : null)
    if (!moving) return
    recordSample(ended.samples, { time: event.timeStamp, position: ended.travel })
    fling(moving, axis, releaseVelocity(ended.samples))
  }

  function onTouchCancel() {
    gesture = null
  }

  inner.addEventListener('wheel', onWheel, { passive: false })
  inner.addEventListener('touchstart', onTouchStart, { passive: true })
  inner.addEventListener('touchmove', onTouchMove, { passive: false })
  inner.addEventListener('touchend', onTouchEnd, { passive: true })
  inner.addEventListener('touchcancel', onTouchCancel, { passive: true })
  return () => {
    inner.removeEventListener('wheel', onWheel)
    inner.removeEventListener('touchstart', onTouchStart)
    inner.removeEventListener('touchmove', onTouchMove)
    inner.removeEventListener('touchend', onTouchEnd)
    inner.removeEventListener('touchcancel', onTouchCancel)
    gesture = null
    restoreOverscroll()
  }
}

// Moving back against a handoff winds the parent back first, never past where it started.
function ownedParentShare(step: number, room: number, driven: number): number {
  if (driven !== 0 && Math.sign(step) !== Math.sign(driven)) {
    return Math.sign(step) * Math.min(Math.abs(step), Math.abs(driven))
  }
  if (Math.abs(step) <= room) return 0
  return step - Math.sign(step) * room
}

function drivenDistance(handoff: Handoff | null): number {
  return handoff ? handoff.goal - handoff.origin : 0
}

function roomToward(metrics: ScrollMetrics, axis: Axis, step: number): number {
  const edge = clampToRange(metrics, axis, step > 0 ? Infinity : -Infinity)
  return Math.abs(edge - metrics[axis])
}

function wheelDelta(event: WheelEvent, metrics: ScrollMetrics): Point {
  return {
    x: event.deltaX * pixelsPerDeltaUnit(event, metrics.viewportWidth),
    y: event.deltaY * pixelsPerDeltaUnit(event, metrics.viewportHeight),
  }
}

function pixelsPerDeltaUnit(event: WheelEvent, viewport: number): number {
  if (event.deltaMode === event.DOM_DELTA_LINE) return LINE_HEIGHT_PX
  if (event.deltaMode === event.DOM_DELTA_PAGE) return viewport
  return 1
}

function isAlongAxis(delta: Point, axis: Axis): boolean {
  const [along, cross] = axis === 'x' ? [delta.x, delta.y] : [delta.y, delta.x]
  return Math.abs(along) >= Math.abs(cross)
}

function scrollAlong(target: ScrollTarget, axis: Axis, distance: number): void {
  if (distance === 0) return
  const next = position(target, axis) + distance
  writeScroll(target, axis === 'x' ? { x: next } : { y: next })
}

function position(target: ScrollTarget, axis: Axis): number {
  return readScroll(target)[axis]
}

function soleTouch(event: TouchEvent): Point | null {
  if (event.touches.length !== 1) return null
  const touch = event.touches[0]
  return { x: touch.clientX, y: touch.clientY }
}
