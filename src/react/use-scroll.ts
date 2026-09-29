import { useMemo, useRef, useState, type RefObject } from 'react'
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

export function useScroll<T extends HTMLElement = HTMLDivElement>(
  options?: AnimateScrollOptions
): ScrollActions & { ref: RefObject<T | null> } {
  const ref = useRef<T>(null)
  const actions = useScrollActions(ref, options)
  return useMemo(() => ({ ...actions, ref }), [actions])
}

export function useWindowScroll(options?: AnimateScrollOptions): ScrollActions {
  return useScrollActions('window', options)
}

function useScrollActions(
  target: ElementTarget,
  options: AnimateScrollOptions | undefined
): ScrollActions {
  const defaults = useRef(options)
  const lastStarted = useRef<ScrollHandle | null>(null)

  useIsomorphicLayoutEffect(() => {
    defaults.current = options
  })
  useIsomorphicLayoutEffect(() => () => lastStarted.current?.cancel(), [])

  const [actions] = useState((): ScrollActions => {
    function attachedTarget(): ScrollTarget {
      const resolved = resolveTarget(target)
      if (!resolved) throw new Error('useScroll: ref is not attached to an element')
      return resolved
    }

    function track(handle: ScrollHandle): ScrollHandle {
      lastStarted.current = handle
      return handle
    }

    return {
      scrollTo: (position, perCall) =>
        track(animateScroll(attachedTarget(), position, { ...defaults.current, ...perCall })),
      scrollBy: (delta, perCall) =>
        track(scrollBy(attachedTarget(), delta, { ...defaults.current, ...perCall })),
      scrollToEdge: (edge, perCall) =>
        track(scrollToEdge(attachedTarget(), edge, { ...defaults.current, ...perCall })),
      scrollToElement: (element, perCall) =>
        track(
          scrollToElement(attachedTarget(), attachedElement(element), {
            ...defaults.current,
            ...perCall,
          })
        ),
      cancel() {
        const resolved = resolveTarget(target)
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
