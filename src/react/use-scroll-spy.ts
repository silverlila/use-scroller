import { useRef, useState, type RefObject } from 'react'
import { observeActiveSection, type ScrollTarget } from '../core'
import { resolveTarget, useIsomorphicLayoutEffect } from './use-element-effect'

type Section = RefObject<HTMLElement | null> | string

interface Subscription {
  root: ScrollTarget
  sections: HTMLElement[]
  offset: number
  unsubscribe: () => void
}

export function useScrollSpy(
  sections: Section[],
  { root, offset = 0 }: { root?: RefObject<HTMLElement | null>; offset?: number } = {}
): number {
  const [active, setActive] = useState(-1)
  const subscription = useRef<Subscription | null>(null)

  // No deps array: `sections` is usually a fresh array each render, and refs can change without one.
  useIsomorphicLayoutEffect(() => {
    const previous = subscription.current
    const rootTarget = resolveTarget(root ?? 'window')
    if (!rootTarget) {
      previous?.unsubscribe()
      subscription.current = null
      return
    }
    const elements = sections.map(resolveSection)
    if (
      previous &&
      previous.root === rootTarget &&
      previous.offset === offset &&
      sameElements(previous.sections, elements)
    ) {
      return
    }
    previous?.unsubscribe()
    subscription.current = {
      root: rootTarget,
      sections: elements,
      offset,
      unsubscribe: observeActiveSection(elements, setActive, { root: rootTarget, offset }),
    }
  })

  useIsomorphicLayoutEffect(
    () => () => {
      subscription.current?.unsubscribe()
      subscription.current = null
    },
    []
  )

  return active
}

function resolveSection(section: Section, index: number): HTMLElement {
  if (typeof section === 'string') {
    const element = document.getElementById(section)
    if (!element) throw new Error(`useScrollSpy: no element with id "${section}"`)
    return element
  }
  if (!section.current) {
    throw new Error(`useScrollSpy: section ref at index ${index} is not attached to an element`)
  }
  return section.current
}

function sameElements(a: HTMLElement[], b: HTMLElement[]): boolean {
  return a.length === b.length && a.every((element, i) => element === b[i])
}
