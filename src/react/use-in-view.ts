import { useRef, useState, type RefObject } from 'react'
import { useIsomorphicLayoutEffect } from './use-element-effect'

export interface InView {
  inView: boolean
  entry: IntersectionObserverEntry | null
}

export interface InViewOptions {
  root?: RefObject<HTMLElement | null>
  rootMargin?: string
  threshold?: number | number[]
  once?: boolean
}

interface Observation {
  element: HTMLElement
  root: HTMLElement | null
  settings: string
  disconnect: () => void
}

const NOT_IN_VIEW: InView = { inView: false, entry: null }

export function useInView(
  ref: RefObject<HTMLElement | null>,
  { root, rootMargin, threshold, once = false }: InViewOptions = {}
): InView {
  const [state, setState] = useState(NOT_IN_VIEW)
  const observation = useRef<Observation | null>(null)
  const seenOnce = useRef(false)

  // No deps array: any commit may attach, detach, or swap the elements behind the refs.
  useIsomorphicLayoutEffect(() => {
    const previous = observation.current
    const element = ref.current
    const rootElement = root ? root.current : null
    if (!element || (root && !rootElement) || seenOnce.current) {
      previous?.disconnect()
      observation.current = null
      return
    }
    // Compared by value: an inline `threshold={[0, 1]}` is a new array every render.
    const settings = JSON.stringify([rootMargin, threshold, once])
    if (
      previous &&
      previous.element === element &&
      previous.root === rootElement &&
      previous.settings === settings
    ) {
      return
    }
    previous?.disconnect()
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        // Per spec (Firefox, Safari) isIntersecting stays true below the threshold while any sliver
        // is visible; Chromium already reports false there.
        const inView =
          entry.isIntersecting && observer.thresholds.some((t) => entry.intersectionRatio >= t)
        setState({ inView, entry })
        if (once && inView) {
          seenOnce.current = true
          observer.disconnect()
        }
      },
      { root: rootElement, rootMargin, threshold }
    )
    observer.observe(element)
    observation.current = {
      element,
      root: rootElement,
      settings,
      disconnect: () => observer.disconnect(),
    }
  })

  useIsomorphicLayoutEffect(
    () => () => {
      observation.current?.disconnect()
      observation.current = null
    },
    []
  )

  return state
}
