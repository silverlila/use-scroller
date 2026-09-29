import { useCallback, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { useScroll } from 'use-scroller'
import { WIDE_QUERY } from './meta'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

export function useWide(): boolean {
  return useMediaQuery(WIDE_QUERY)
}

export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() =>
      setSize({ width: element.clientWidth, height: element.clientHeight })
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}

function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

export function useViewportHeight(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => document.documentElement.clientHeight,
    () => 0
  )
}

export function navOffset(wide: boolean) {
  return wide ? 32 : 68
}

export function spyOffset(wide: boolean) {
  return wide ? 140 : 120
}

export function useGoToSection() {
  const page = useScroll('window')
  const wide = useWide()
  return useCallback(
    (id: string) => {
      const section = document.getElementById(id)
      if (!section) return
      page.scrollToElement(section, { align: 'start', offset: navOffset(wide) })
      history.replaceState(null, '', `#${id}`)
      section.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true })
    },
    [page, wide]
  )
}

export function formatInt(value: number) {
  return Math.round(value).toLocaleString('en-US').replace(/,/g, ' ')
}
