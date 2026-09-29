import { animateScroll, cancelScroll, type ScrollHandle } from './animate-scroll'
import { fling, projectMomentum } from './fling'
import { readScroll, writeScroll } from './geometry'
import { setInlineStyles, type Restore } from './inline-style'
import { pickSnapTarget, readSnapPositions } from './snap'
import type { Axis } from './types'
import { recordSample, releaseVelocity, type Sample } from './velocity'

export interface DragScrollOptions {
  axis?: Axis
  mouse?: boolean
}

interface Point {
  x: number
  y: number
}

interface Pointer {
  pointerId: number
  pointerType: string
}

interface SuspendedSnap {
  positions: number[]
  restore: Restore
}

interface Pending extends Pointer {
  kind: 'pending'
  origin: Point
  snap: SuspendedSnap | null
}

interface Drag extends Pointer {
  kind: 'dragging'
  origin: number
  startScroll: number
  samples: Sample[]
  snap: SuspendedSnap
  restoreUserSelect: Restore
}

type Gesture = Pending | Drag

interface Release {
  handle: ScrollHandle
  positions: number[]
}

const DRAG_SLOP = 8
// The click a drag produces follows its pointerup at once; anything later is a separate click.
const CLICK_AFTER_DRAG_MS = 100
// pinch-zoom stays allowed so the track never blocks zooming the page.
const NATIVE_PAN: Record<Axis, string> = { x: 'pan-y pinch-zoom', y: 'pan-x pinch-zoom' }

export function dragScroll(
  element: HTMLElement,
  { axis = 'x', mouse = false }: DragScrollOptions = {}
): () => void {
  const restoreTouchAction = setInlineStyles(element, { 'touch-action': NATIVE_PAN[axis] })
  let gesture: Gesture | null = null
  let release: Release | null = null
  let suppressClicksUntil = -Infinity

  function accepts(event: PointerEvent): boolean {
    if (!event.isPrimary) return false
    if (event.pointerType === 'touch') return true
    return mouse && event.pointerType === 'mouse' && event.button === 0
  }

  function onPointerDown(event: PointerEvent) {
    suppressClicksUntil = -Infinity
    if (!accepts(event)) return
    endGesture(0)
    gesture = {
      kind: 'pending',
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      origin: pointFrom(event),
      snap: interruptRelease(),
    }
  }

  // Re-suspended in the same task, since WebKit may re-snap at the next layout before a drag starts.
  function interruptRelease(): SuspendedSnap | null {
    if (!release) return null
    const { handle, positions } = release
    handle.cancel()
    return { positions, restore: suspendSnap() }
  }

  function suspendSnap(): Restore {
    return setInlineStyles(element, { 'scroll-snap-type': 'none' })
  }

  function onPointerMove(event: PointerEvent) {
    if (gesture?.pointerId !== event.pointerId) return
    if (gesture.kind === 'pending') {
      // A mouse released outside the element never sent us its pointerup.
      if (!isPressed(event)) {
        endGesture(0)
        return
      }
      const intent = judgeIntent(gesture.origin, pointFrom(event), axis)
      if (intent === 'cross-axis') endGesture(0)
      if (intent === 'along-axis') gesture = startDrag(gesture, event)
      return
    }
    const position = dragPosition(gesture, event)
    recordSample(gesture.samples, { time: event.timeStamp, position })
    writeScroll(element, axis === 'x' ? { x: position } : { y: position })
  }

  function dragPosition(drag: Drag, event: PointerEvent): number {
    return drag.startScroll - (alongAxis(event, axis) - drag.origin)
  }

  function startDrag(pending: Pending, event: PointerEvent): Drag {
    element.setPointerCapture(event.pointerId)
    cancelScroll(element)
    const snap = pending.snap ?? {
      positions: readSnapPositions(element, axis),
      restore: suspendSnap(),
    }
    const startScroll = readScroll(element)[axis]
    return {
      kind: 'dragging',
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      origin: alongAxis(event, axis),
      startScroll,
      samples: [{ time: event.timeStamp, position: startScroll }],
      snap,
      restoreUserSelect:
        event.pointerType === 'mouse'
          ? setInlineStyles(element, { 'user-select': 'none', '-webkit-user-select': 'none' })
          : noop,
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (gesture?.pointerId !== event.pointerId) return
    if (gesture.kind === 'pending') {
      endGesture(0)
      return
    }
    recordSample(gesture.samples, { time: event.timeStamp, position: dragPosition(gesture, event) })
    suppressClicksUntil = event.timeStamp + CLICK_AFTER_DRAG_MS
    endGesture(releaseVelocity(gesture.samples))
  }

  function onPointerCancel(event: PointerEvent) {
    if (gesture?.pointerId === event.pointerId) endGesture(0)
  }

  function endGesture(velocity: number) {
    const ended = gesture
    gesture = null
    if (ended?.kind === 'dragging') ended.restoreUserSelect()
    if (ended?.snap) settle(ended.snap, velocity)
  }

  function settle({ positions, restore }: SuspendedSnap, velocity: number) {
    if (positions.length === 0) {
      restore()
      track(fling(element, axis, velocity), positions)
      return
    }
    const current = readScroll(element)[axis]
    const target = pickSnapTarget(positions, current, current + projectMomentum(velocity), velocity)
    // animateScroll suspends snapping itself for the animation and restores it however it ends.
    restore()
    const handle = animateScroll(element, axis === 'x' ? { x: target } : { y: target }, {
      animation: { type: 'spring', velocity: axis === 'x' ? { x: velocity } : { y: velocity } },
      respectReducedMotion: false,
    })
    track(handle, positions)
  }

  function track(handle: ScrollHandle | null, positions: number[]) {
    if (!handle) return
    const current: Release = { handle, positions }
    release = current
    void handle.finished.then(() => {
      if (release === current) release = null
    })
  }

  // A mouse press on a link or image starts native drag-and-drop, which cancels the pointer.
  function onDragStart(event: DragEvent) {
    if (gesture?.pointerType === 'mouse') event.preventDefault()
  }

  function onClick(event: MouseEvent) {
    if (event.timeStamp > suppressClicksUntil) return
    suppressClicksUntil = -Infinity
    event.preventDefault()
    event.stopPropagation()
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', onPointerUp)
  element.addEventListener('pointercancel', onPointerCancel)
  element.addEventListener('dragstart', onDragStart)
  element.addEventListener('click', onClick, { capture: true })
  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerUp)
    element.removeEventListener('pointercancel', onPointerCancel)
    element.removeEventListener('dragstart', onDragStart)
    element.removeEventListener('click', onClick, { capture: true })
    if (gesture?.kind === 'dragging') gesture.restoreUserSelect()
    gesture?.snap?.restore()
    gesture = null
    release?.handle.cancel()
    release = null
    restoreTouchAction()
  }
}

function judgeIntent(
  origin: Point,
  point: Point,
  axis: Axis
): 'undecided' | 'along-axis' | 'cross-axis' {
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  if (Math.hypot(dx, dy) < DRAG_SLOP) return 'undecided'
  const [along, cross] = axis === 'x' ? [dx, dy] : [dy, dx]
  return Math.abs(cross) > Math.abs(along) ? 'cross-axis' : 'along-axis'
}

function isPressed(event: PointerEvent): boolean {
  return (event.buttons & 1) === 1
}

function pointFrom(event: PointerEvent): Point {
  return { x: event.clientX, y: event.clientY }
}

function alongAxis(event: PointerEvent, axis: Axis): number {
  return axis === 'x' ? event.clientX : event.clientY
}

function noop() {
  // Nothing was changed, so there is nothing to restore.
}
