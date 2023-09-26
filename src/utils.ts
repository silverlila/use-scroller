import { RefObject } from 'react'
import { EasingFunction, EasingFunctions, EasingOptions, ScrollOptions } from './types'

// Check if the code is running on the server-side.
export const isServer = typeof window === 'undefined' || typeof document === 'undefined'

// Default scroll options used if no options are provided.
export const defaultScrollOptions: ScrollOptions = {
  direction: 'vertical',
  duration: 300,
  easingOption: 'ease-in-out',
}

/**
 * Resolves scroll values based on the type of element.
 * @param {HTMLElement | Window} element - The element to retrieve scroll values from.
 * @returns {object} - An object containing scroll-related properties.
 */
export const resolveScrollValues = (element: HTMLElement | Window) => {
  const isWindow = element instanceof Window
  const docElement = document.documentElement
  const docBody = document.body

  const scrollLeftMax = isWindow
    ? Math.max(docBody.scrollLeft, docElement.scrollLeft)
    : element.scrollWidth - element.clientWidth
  const scrollTopMax = isWindow
    ? Math.max(docBody.scrollTop, docElement.scrollTop)
    : element.scrollHeight - element.clientHeight

  return {
    scrollLeft: isWindow ? docBody.scrollLeft || docElement.scrollLeft : element.scrollLeft,
    scrollTop: isWindow ? docBody.scrollTop || docElement.scrollTop : element.scrollTop,
    scrollWidth: isWindow ? docBody.scrollWidth || docElement.scrollWidth : element.scrollWidth,
    clientWidth: isWindow ? docBody.clientWidth || docElement.clientWidth : element.clientWidth,
    clientHeight: isWindow ? docBody.clientHeight || docElement.clientHeight : element.clientHeight,
    scrollHeight: isWindow ? docBody.scrollHeight || docElement.scrollHeight : element.scrollHeight,
    scrollLeftMax,
    scrollTopMax,
  }
}

/**
 * Validate if the element passed to the function is valid.
 * @param {HTMLElement | Window} element - The element to validate.
 */
export function validateElement(element?: HTMLElement | Window) {
  if (element === undefined) {
    throw new Error(`The element passed to scroller() was undefined`)
  }
  if (!(element instanceof HTMLElement || Window)) {
    throw new TypeError(
      `
      The element passed to scroller() must be a valid element. 
      You passed ${element}.
      `
    )
  }
}

/**
 * Get the DOM element from a React ref object.
 * @param {RefObject<HTMLElement>} ref - The React ref object.
 * @returns {HTMLElement} - The DOM element.
 */
export const getElement = (ref: RefObject<HTMLElement>) => {
  if (!ref.current) {
    throw new Error(`Could not resolve ref object: ${ref.current}`)
  }
  return ref.current
}

// Map of easing functions for scroll animations.
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

/**
 * Get an easing function based on the provided easing option or the default option.
 * @param {EasingOptions} easing - The easing option.
 * @returns {EasingFunction} - The easing function.
 */
export const getEasing = (easing?: EasingOptions): EasingFunction => {
  const easeFunc = easingMap[easing || defaultScrollOptions.easingOption]
  if (!easeFunc) {
    const options = Object.keys(easingMap).join(',')
    throw new Error(
      `Scroll error: scroller does not support an easing option of "${easing}". Supported options are ${options}`
    )
  }
  return easeFunc
}
