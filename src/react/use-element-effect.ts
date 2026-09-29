import { useEffect, useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react'
import type { ScrollTarget } from '../core'

export type ElementTarget = RefObject<HTMLElement | null> | 'window'

type Cleanup = () => void

interface Subscription {
  target: ScrollTarget | null
  deps: DependencyList
  cleanup: Cleanup | void
}

// React 18 warns when useLayoutEffect is rendered on the server.
export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function resolveTarget(target: ElementTarget): ScrollTarget | null {
  return target === 'window' ? window : target.current
}

export function useElementEffect(
  target: ElementTarget,
  effect: (target: ScrollTarget) => Cleanup | void,
  deps: DependencyList
): void {
  const subscription = useRef<Subscription | null>(null)

  function sync() {
    const resolved = resolveTarget(target)
    const previous = subscription.current
    if (previous && previous.target === resolved && sameDeps(previous.deps, deps)) return
    if (previous?.cleanup) previous.cleanup()
    subscription.current = {
      target: resolved,
      deps,
      cleanup: resolved ? effect(resolved) : undefined,
    }
  }

  // No deps arrays: any commit may attach, detach, or swap the element behind a ref. The passive
  // re-check catches refs on elements later in tree order, attached after our layout effects ran.
  useIsomorphicLayoutEffect(sync)
  useEffect(sync)

  useIsomorphicLayoutEffect(
    () => () => {
      subscription.current?.cleanup?.()
      subscription.current = null
    },
    []
  )
}

function sameDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((dep, i) => Object.is(dep, b[i]))
}
