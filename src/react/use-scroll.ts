import { useRef, useState, type RefObject } from 'react'
import {
  animateScroll,
  cancelScroll,
  scrollBy,
  scrollToEdge,
  scrollToElement,
  type AnimateScrollOptions,
  type Edge,
  type ScrollDestination,
  type ScrollHandle,
  type ScrollTarget,
  type ScrollToElementOptions,
} from '../core'
import { resolveTarget, useIsomorphicLayoutEffect, type ElementTarget } from './use-element-effect'

export interface ScrollActions {
  scrollTo(position: ScrollDestination, options?: AnimateScrollOptions): ScrollHandle
  scrollBy(delta: ScrollDestination, options?: AnimateScrollOptions): ScrollHandle
  scrollToEdge(edge: Edge, options?: AnimateScrollOptions): ScrollHandle
  scrollToElement(
    element: HTMLElement | RefObject<HTMLElement | null>,
    options?: ScrollToElementOptions
  ): ScrollHandle
  cancel(): void
}

export function useScroll(target: ElementTarget, options?: AnimateScrollOptions): ScrollActions {
  const latest = useRef({ target, options })
  const lastStarted = useRef<ScrollHandle | null>(null)

  useIsomorphicLayoutEffect(() => {
    latest.current = { target, options }
  })
  useIsomorphicLayoutEffect(() => () => lastStarted.current?.cancel(), [])

  const [actions] = useState((): ScrollActions => {
    function attachedTarget(): ScrollTarget {
      const resolved = resolveTarget(latest.current.target)
      if (!resolved) throw new Error('useScroll: ref is not attached to an element')
      return resolved
    }

    function track(handle: ScrollHandle): ScrollHandle {
      lastStarted.current = handle
      return handle
    }

    function withDefaults<T extends AnimateScrollOptions>(perCall: T | undefined) {
      return { ...latest.current.options, ...perCall }
    }

    return {
      scrollTo: (position, perCall) =>
        track(animateScroll(attachedTarget(), position, withDefaults(perCall))),
      scrollBy: (delta, perCall) => track(scrollBy(attachedTarget(), delta, withDefaults(perCall))),
      scrollToEdge: (edge, perCall) =>
        track(scrollToEdge(attachedTarget(), edge, withDefaults(perCall))),
      scrollToElement: (element, perCall) =>
        track(scrollToElement(attachedTarget(), attachedElement(element), withDefaults(perCall))),
      cancel() {
        const resolved = resolveTarget(latest.current.target)
        if (resolved) cancelScroll(resolved)
      },
    }
  })
  return actions
}

function attachedElement(element: HTMLElement | RefObject<HTMLElement | null>): HTMLElement {
  if (!('current' in element)) return element
  if (!element.current) {
    throw new Error('useScroll: scrollToElement ref is not attached to an element')
  }
  return element.current
}
