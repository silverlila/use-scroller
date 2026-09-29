import { animateScroll, clampToRange, type ScrollHandle } from './animate-scroll'
import { easings } from './easings'
import { readScroll } from './geometry'
import type { Axis, ScrollTarget } from './types'

const DECELERATION_PER_MS = 0.998
const MIN_FLING_VELOCITY = 50
const FRAME_MS = 1000 / 60
// easeOutCubic starts with slope 3, so this duration makes the tween leave at the release velocity.
const EASE_OUT_CUBIC_INITIAL_SLOPE = 3

export function projectMomentum(velocity: number): number {
  return ((velocity / 1000) * DECELERATION_PER_MS) / (1 - DECELERATION_PER_MS)
}

export function fling(target: ScrollTarget, axis: Axis, velocity: number): ScrollHandle | null {
  if (!(Math.abs(velocity) >= MIN_FLING_VELOCITY)) return null
  const metrics = readScroll(target)
  const current = axis === 'x' ? metrics.x : metrics.y
  const destination = clampToRange(metrics, axis, current + projectMomentum(velocity))
  const duration = Math.max(
    FRAME_MS,
    ((EASE_OUT_CUBIC_INITIAL_SLOPE * Math.abs(destination - current)) / Math.abs(velocity)) * 1000
  )
  return animateScroll(target, axis === 'x' ? { x: destination } : { y: destination }, {
    animation: { type: 'tween', duration, easing: easings.easeOutCubic },
    // Momentum carries on the user's own gesture, which native scrolling keeps under reduced motion.
    respectReducedMotion: false,
  })
}
