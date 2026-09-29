import { useRef, type RefObject } from 'react'
import { lockScroll } from '../core'
import { useIsomorphicLayoutEffect } from './use-element-effect'

interface HeldLock {
  allow: HTMLElement[]
  unlock: () => void
}

export function useScrollLock(
  active: boolean,
  { allow = [] }: { allow?: Array<RefObject<HTMLElement | null>> } = {}
): void {
  const held = useRef<HeldLock | null>(null)

  // No deps array: any commit may attach, detach, or swap the elements behind the refs.
  useIsomorphicLayoutEffect(() => {
    const previous = held.current
    if (!active) {
      previous?.unlock()
      held.current = null
      return
    }
    const elements = allow.flatMap((ref) => (ref.current ? [ref.current] : []))
    if (previous && sameElements(previous.allow, elements)) return
    held.current = { allow: elements, unlock: lockScroll({ allow: elements }) }
    // Released after the new lock is taken, so the page never unlocks in between.
    previous?.unlock()
  })

  useIsomorphicLayoutEffect(
    () => () => {
      held.current?.unlock()
      held.current = null
    },
    []
  )
}

function sameElements(a: HTMLElement[], b: HTMLElement[]): boolean {
  return a.length === b.length && a.every((element, i) => element === b[i])
}
