import { EasingOptions } from './types'
import { getEasing } from './utils'

export interface EasingConfig {
  from: number
  to: number
  duration: number
  easing: EasingOptions
  onUpdate: (position: number) => void
  onComplete?: () => void
}

export interface MomentumConfig {
  from: number
  to: number
  friction: number
  duration: number // Used to calculate initial velocity
  onUpdate: (position: number) => void
  onComplete?: () => void
}

/**
 * Animation controller that can be cancelled
 */
export interface AnimationController {
  cancel: () => void
}

/**
 * Creates a time-based easing animation
 *
 * @param config - Animation configuration
 * @returns Controller with cancel method
 *
 * @example
 * ```typescript
 * const animation = createEasingAnimation({
 *   from: 0,
 *   to: 1000,
 *   duration: 300,
 *   easing: 'ease-out',
 *   onUpdate: (pos) => element.scrollTop = pos
 * })
 *
 * // Later, if needed:
 * animation.cancel()
 * ```
 */
export function createEasingAnimation(config: EasingConfig): AnimationController {
  const { from, to, duration, easing, onUpdate, onComplete } = config

  let animationId = 0
  let startTime: number | null = null

  // Pre-calculate values outside the animation loop for performance
  const distance = to - from
  const easingFunc = getEasing(easing)

  /**
   * Animation loop - called every frame by requestAnimationFrame
   *
   * Time-based animation formula:
   * 1. Calculate time progress (t): 0 to 1 based on elapsed time
   * 2. Apply easing function to t: easing(t) gives curved progress
   * 3. Calculate position: start + distance × easing(t)
   */
  function animate(currentTime: number) {
    // Initialize start time on first frame
    if (!startTime) startTime = currentTime

    // Calculate elapsed time and normalize to 0-1 range (timeFraction)
    const elapsedTime = currentTime - startTime
    const timeFraction = Math.min(elapsedTime / duration, 1)

    // Apply easing curve to time fraction
    // Example: ease-out makes timeFraction=0.5 → easedFraction=0.75
    // This creates the "fast start, slow end" effect
    const easedFraction = easingFunc(timeFraction)

    // Calculate current position using eased progress
    const currentPosition = from + distance * easedFraction

    // Update the scroll position
    onUpdate(currentPosition)

    if (timeFraction < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      animationId = 0
      onComplete?.()
    }
  }

  animationId = requestAnimationFrame(animate)

  return {
    cancel: () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = 0
      }
    },
  }
}

/**
 * Creates a physics-based momentum animation with exponential decay
 *
 * @param config - Momentum configuration
 * @returns Controller with cancel method
 *
 * Physics explanation:
 * - Velocity decays exponentially: v(t) = v₀ × friction^t
 * - Friction is applied each frame (typical range: 0.8 to 0.98)
 * - Lower friction = faster deceleration (like sliding on rough surface)
 * - Higher friction = slower deceleration (like sliding on ice)
 *
 * @example
 * ```typescript
 * const animation = createMomentumAnimation({
 *   from: 0,
 *   to: 1000,
 *   friction: 0.95,  // 95% velocity retained per second
 *   duration: 1000,  // Used to calculate initial velocity
 *   onUpdate: (pos) => element.scrollTop = pos
 * })
 * ```
 */
export function createMomentumAnimation(config: MomentumConfig): AnimationController {
  const { from, to, friction, duration, onUpdate, onComplete } = config

  let animationId = 0
  let startTime: number | null = null

  // Pre-calculate direction and distance
  const distance = to - from
  const absDistance = Math.abs(distance)
  const direction = distance > 0 ? 1 : -1

  /**
   * Calculate initial velocity based on desired distance and duration
   *
   * Formula: v₀ = distance / duration (pixels per millisecond)
   *
   * This gives us the velocity needed to cover the distance in the given duration
   * without friction. Friction will then slow it down naturally.
   */
  const initialVelocityPerMs = absDistance / duration

  /**
   * Momentum animation loop
   *
   * Physics model: Exponential decay
   * - velocity(t) = v₀ × friction^(t/1000)
   * - position(t) = start + direction × distance × (1 - friction^(t/1000))
   *
   * Why divide by 1000?
   * - Time is in milliseconds
   * - Friction is "per second" (e.g., 0.95 = 95% retained per second)
   * - So we need: friction^(milliseconds/1000) = friction^seconds
   */
  function animate(currentTime: number) {
    if (!startTime) startTime = currentTime

    // Calculate actual elapsed time in milliseconds
    const elapsedTime = currentTime - startTime

    // Convert to seconds for friction calculation
    const elapsedSeconds = elapsedTime / 1000

    // Calculate current velocity using exponential decay
    // v(t) = v₀ × friction^t
    const currentVelocity = initialVelocityPerMs * 1000 * Math.pow(friction, elapsedSeconds)

    // Stop if velocity drops below threshold (< 0.5 pixels/second)
    // This prevents infinite animation as it approaches zero
    if (currentVelocity < 0.5) {
      // Snap to final position for precision
      onUpdate(to)
      animationId = 0
      onComplete?.()
      return
    }

    // Calculate distance traveled using decay formula
    // Integration of velocity over time gives us:
    // distance(t) = total_distance × (1 - friction^t)
    const decayFactor = Math.pow(friction, elapsedSeconds)
    const traveledDistance = absDistance * (1 - decayFactor)

    // Calculate current position
    const currentPosition = from + direction * traveledDistance

    // Update scroll position
    onUpdate(currentPosition)

    // Continue animation
    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)

  return {
    cancel: () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = 0
      }
    },
  }
}
