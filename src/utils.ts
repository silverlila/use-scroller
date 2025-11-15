import { RefObject } from 'react'
import { EasingFunction, EasingOptions } from './types'
import { defaultScrollOptions, easingMap, isServer } from './constants'

export const getElement = (ref: RefObject<HTMLElement>) => {
  if (!ref.current) {
    throw new Error(`Could not resolve ref object: ${ref.current}`)
  }
  return ref.current
}

export const getEasing = (easing?: EasingOptions): EasingFunction => {
  const easeFunc = easingMap[easing || defaultScrollOptions.easing]
  if (!easeFunc) {
    const options = Object.keys(easingMap).join(',')
    throw new Error(
      `Scroll error: scroller does not support an easing option of "${easing}". Supported options are ${options}`
    )
  }
  return easeFunc
}

export const prefersReducedMotion = (): boolean => {
  if (isServer) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
