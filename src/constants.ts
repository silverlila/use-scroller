import { EasingFunctions, EasingScrollOptions } from './types'

export const isServer = typeof window === 'undefined' || typeof document === 'undefined'

/**
 * Default scroll options - easing animation with ease-out curve
 * This is the most common and natural-feeling animation for UI
 */
export const defaultScrollOptions: EasingScrollOptions = {
  animation: 'easing',
  direction: 'vertical',
  easing: 'ease-out',
  duration: 300,
  respectMotionPreference: true,
}

export const easingMap: EasingFunctions = {
  linear(t: number) {
    return t
  },

  'ease-in'(t: number) {
    return t * t
  },

  'ease-out'(t: number) {
    return t * (2 - t)
  },

  'ease-in-out'(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  },
}
