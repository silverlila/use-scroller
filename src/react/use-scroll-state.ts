import { useMemo, useState, useSyncExternalStore } from 'react'
import { initialScrollState, observeScroll, type ScrollState } from '../core'
import { useElementEffect, type ElementTarget } from './use-element-effect'

export function useScrollState(target: ElementTarget): ScrollState
export function useScrollState<T>(target: ElementTarget, select: (state: ScrollState) => T): T
export function useScrollState<T>(
  target: ElementTarget,
  select?: (state: ScrollState) => T
): ScrollState | T {
  const [store] = useState(createScrollStore)
  useElementEffect(target, (element) => observeScroll(element, store.set), [store])
  const [getSnapshot, getServerSnapshot] = useMemo(() => {
    const choose: (state: ScrollState) => ScrollState | T = select ?? identity
    const selectFrom = memoizeLast(choose)
    return [() => selectFrom(store.get()), () => selectFrom(initialScrollState)]
  }, [store, select])
  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot)
}

function createScrollStore() {
  let state = initialScrollState
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next: ScrollState) {
      state = next
      for (const listener of listeners) listener()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

// useSyncExternalStore loops forever if repeated reads of an unchanged store return new objects,
// which a selector like `(s) => ({ x: s.x })` would.
function memoizeLast<A, R>(fn: (arg: A) => R): (arg: A) => R {
  let last: { arg: A; result: R } | null = null
  return (arg) => {
    if (last === null || last.arg !== arg) last = { arg, result: fn(arg) }
    return last.result
  }
}

function identity<T>(value: T): T {
  return value
}
