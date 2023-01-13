import { RefObject } from 'react'
import { EasingFunction, EasingFunctions, EasingOptions, ScrollOptions } from './types'

export const isServer = typeof window === 'undefined' || typeof document === 'undefined'
export const defaultScrollOptions: ScrollOptions = {
  direction: 'vertical',
  duration: 300,
  easingOption: 'linear',
}

export const resolveScrollValues = (element: HTMLElement | Window) => {
  if (
    element === document.body ||
    element === document.documentElement ||
    element instanceof Window
  ) {
    return {
      scrollLeft: document.body.scrollLeft || document.documentElement.scrollLeft,
      scrollTop: document.body.scrollTop || document.documentElement.scrollTop,
      scrollWidth: document.body.scrollWidth || document.documentElement.scrollWidth,
      clientWidth: document.body.clientWidth || document.documentElement.clientWidth,
      clientHeight: document.body.clientHeight || document.documentElement.clientHeight,
      scrollHeight: document.body.scrollHeight || document.documentElement.scrollHeight,
    }
  }
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }
}

export const getElement = (ref: RefObject<HTMLElement>) => {
  if (!ref.current) {
    throw new Error(`Could not resolve ref object: ${ref.current}`)
  }
  return ref.current
}

/**
 * Validate if element passed to the function is valid.
 * @param element {HTMLElement | Window}
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

export type ScrollableElement = (Element & HTMLElement) | Window

/**
 * If the currentTarget is the window then we return the scrollX/Y position.
 * If not (ie the currentTarget is a DOM element), then we return scrollLeft/Top
 * @param event
 */
export function scrollValues(element: ScrollableElement) {
  const { scrollX, scrollY, scrollLeft, scrollTop } = element as Element & Window
  return {
    scrollTop: scrollY ?? scrollTop ?? 0,
    scrollLeft: scrollX ?? scrollLeft ?? 0,
  }
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

export const getEasing = (easing?: EasingOptions): EasingFunction => {
  const defaultEasing = 'linear'
  const easeFunc = easingMap[easing || defaultEasing]
  if (!easeFunc) {
    const options = Object.keys(easingMap).join(',')
    throw new Error(
      `Scroll error: scroller does not support an easing option of "${easing}". Supported options are ${options}`
    )
  }
  return easeFunc
}
