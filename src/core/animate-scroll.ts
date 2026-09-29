import { easings, type Easing } from './easings'
import { isWindow, readScroll, writeScroll, type ScrollMetrics } from './geometry'
import { setInlineStyles, type Restore } from './inline-style'
import type { Axis, ScrollTarget } from './types'

export type ScrollAnimation =
  | { type: 'tween'; duration?: number; easing?: Easing }
  | {
      type: 'spring'
      stiffness?: number
      damping?: number
      mass?: number
      velocity?: { x?: number; y?: number }
    }
  | { type: 'instant' }

export type ScrollResult = 'completed' | 'interrupted' | 'cancelled'

export interface ScrollHandle {
  finished: Promise<ScrollResult>
  cancel(): void
}

export interface AnimateScrollOptions {
  animation?: ScrollAnimation
  interruptible?: boolean
  respectReducedMotion?: boolean
}

export interface ScrollDestination {
  x?: number
  y?: number
}

type Point = Record<Axis, number>
type Motion = (elapsed: number, goal: Point) => { position: Point; done: boolean }
type TweenAnimation = Extract<ScrollAnimation, { type: 'tween' }>
type SpringAnimation = Extract<ScrollAnimation, { type: 'spring' }>

const AXES: readonly Axis[] = ['x', 'y']
const INTERRUPT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown']
const SPRING_STEP_MS = 1000 / 120
const SETTLE_DISTANCE = 0.5
const SETTLE_SPEED = 10

const running = new WeakMap<ScrollTarget, { to: ScrollDestination; cancel(): void }>()

export function animateScroll(
  target: ScrollTarget,
  to: ScrollDestination,
  options: AnimateScrollOptions = {}
): ScrollHandle {
  const {
    animation = { type: 'tween' },
    interruptible = true,
    respectReducedMotion = true,
  } = options
  cancelScroll(target)
  if (animation.type === 'instant' || (respectReducedMotion && prefersReducedMotion())) {
    return jump(target, to)
  }
  const createMotion = animation.type === 'tween' ? tween(animation) : spring(animation)
  return run(target, to, createMotion, interruptible)
}

export function cancelScroll(target: ScrollTarget): void {
  running.get(target)?.cancel()
}

export function scrollDestination(target: ScrollTarget): Point {
  const metrics = readScroll(target)
  const current = { x: metrics.x, y: metrics.y }
  const active = running.get(target)
  return active ? resolveGoal(active.to, current, metrics) : current
}

export function clampToRange(metrics: ScrollMetrics, axis: Axis, value: number): number {
  const min = axis === 'x' ? metrics.minX : 0
  const max = axis === 'x' ? metrics.maxX : metrics.maxY
  return Math.min(max, Math.max(min, value))
}

function resolveGoal(to: ScrollDestination, fallback: Point, metrics: ScrollMetrics): Point {
  return {
    x: to.x === undefined ? fallback.x : clampToRange(metrics, 'x', to.x),
    y: to.y === undefined ? fallback.y : clampToRange(metrics, 'y', to.y),
  }
}

function requestedAxes(to: ScrollDestination, position: Point): ScrollDestination {
  return {
    x: to.x === undefined ? undefined : position.x,
    y: to.y === undefined ? undefined : position.y,
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function jump(target: ScrollTarget, to: ScrollDestination): ScrollHandle {
  const metrics = readScroll(target)
  writeScroll(target, requestedAxes(to, resolveGoal(to, metrics, metrics)))
  return {
    finished: Promise.resolve('completed'),
    cancel() {
      // The jump already happened; there is nothing left to cancel.
    },
  }
}

function run(
  target: ScrollTarget,
  to: ScrollDestination,
  createMotion: (from: Point) => Motion,
  interruptible: boolean
): ScrollHandle {
  const snapElement = isWindow(target) ? target.document.documentElement : target
  // Suspend snapping before measuring, so the layout readScroll forces can't re-snap the start.
  const restoreSnap = suspendSnap(snapElement)
  const eventTarget: EventTarget = target
  const start = readScroll(target)
  const from = { x: start.x, y: start.y }
  const motion = createMotion(from)
  const startedAt = performance.now()
  let frame = requestAnimationFrame(step)
  let stopped = false
  let resolveFinished: (result: ScrollResult) => void
  const finished = new Promise<ScrollResult>((resolve) => (resolveFinished = resolve))
  const entry = { to, cancel: () => stop('cancelled') }
  const interrupt = () => stop('interrupted')

  function step(now: number) {
    const metrics = readScroll(target)
    const { position, done } = motion(Math.max(0, now - startedAt), resolveGoal(to, from, metrics))
    writeScroll(target, requestedAxes(to, position))
    if (done) stop('completed')
    else frame = requestAnimationFrame(step)
  }

  function stop(result: ScrollResult) {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    for (const type of INTERRUPT_EVENTS) eventTarget.removeEventListener(type, interrupt)
    restoreSnap?.()
    if (running.get(target) === entry) running.delete(target)
    resolveFinished(result)
  }

  if (interruptible) {
    for (const type of INTERRUPT_EVENTS) {
      eventTarget.addEventListener(type, interrupt, { passive: true })
    }
  }
  running.set(target, entry)
  return { finished, cancel: entry.cancel }
}

function suspendSnap(element: HTMLElement): Restore | null {
  if (getComputedStyle(element).scrollSnapType === 'none') return null
  return setInlineStyles(element, { 'scroll-snap-type': 'none' })
}

function tween({ duration = 450, easing = easings.easeOutCubic }: TweenAnimation) {
  if (!(duration >= 0)) {
    throw new RangeError(`animateScroll: tween duration must be >= 0, got ${duration}`)
  }
  return (from: Point): Motion =>
    (elapsed, goal) => {
      const progress = duration > 0 ? Math.min(1, elapsed / duration) : 1
      if (progress === 1) return { position: goal, done: true }
      const eased = easing(progress)
      return {
        position: { x: from.x + (goal.x - from.x) * eased, y: from.y + (goal.y - from.y) * eased },
        done: false,
      }
    }
}

function spring({
  stiffness = 170,
  damping = 26,
  mass = 1,
  velocity: initial = {},
}: SpringAnimation) {
  for (const [name, value] of Object.entries({ stiffness, damping, mass })) {
    if (!(value > 0)) {
      throw new RangeError(`animateScroll: spring ${name} must be > 0, got ${value}`)
    }
  }
  return (from: Point): Motion => {
    const position = { ...from }
    const velocity = { x: initial.x ?? 0, y: initial.y ?? 0 }
    const dt = SPRING_STEP_MS / 1000
    let stepsTaken = 0
    return (elapsed, goal) => {
      // Fixed substeps keep the integration stable regardless of the display's frame rate.
      for (; stepsTaken < Math.floor(elapsed / SPRING_STEP_MS); stepsTaken++) {
        for (const axis of AXES) {
          const force = -stiffness * (position[axis] - goal[axis]) - damping * velocity[axis]
          velocity[axis] += (force / mass) * dt
          position[axis] += velocity[axis] * dt
        }
      }
      const settled = AXES.every(
        (axis) =>
          Math.abs(position[axis] - goal[axis]) < SETTLE_DISTANCE &&
          Math.abs(velocity[axis]) < SETTLE_SPEED
      )
      return settled ? { position: goal, done: true } : { position: { ...position }, done: false }
    }
  }
}
