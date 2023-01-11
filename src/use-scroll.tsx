import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ScrollProps, ScrollResponse } from './types'
import { scroller } from './scroller'
import { getElement } from './utils'

export function useScroll<T extends HTMLElement>({
  direction = 'vertical',
  duration = 300,
}: ScrollProps): ScrollResponse<T> {
  const ref = useRef<T>(null)
  const props = { direction, duration }
  const [state, setState] = useState(() => ({
    left: 0,
    top: 0,
    isScrollable: false,
    isScrolledLeft: false,
    isScrolledRight: false,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))

  const scrollToTarget = useCallback((currentTarget: HTMLElement) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ ...props, container })
    scrollContainer.scrollToTarget(currentTarget)
  }, [])

  const scrollTop = useCallback((offset?: number | undefined) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ ...props, container })
    scrollContainer.scrollToTop(offset)
  }, [])

  const scrollBottom = useCallback((offset?: number | undefined) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ ...props, container })
    scrollContainer.scrollToBottom(offset)
  }, [])

  const scrollRight = useCallback((offset?: number | undefined) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ ...props, container })
    scrollContainer.scrollToRight(offset)
  }, [])

  const scrollLeft = useCallback((offset?: number | undefined) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ ...props, container })
    scrollContainer.scrollToLeft(offset)
  }, [])

  useLayoutEffect(() => {
    const scrollContainer = ref.current
    if (!scrollContainer) return

    const { scrollWidth, clientWidth, clientHeight, scrollHeight } = scrollContainer
    const isScrollable = clientWidth !== scrollWidth || clientHeight !== scrollHeight
    setState((prev) => ({ ...prev, isScrollable }))

    const handleScroll = () => {
      if (scrollContainer) {
        const { scrollLeft, scrollTop } = scrollContainer
        const scrollState = {
          ...state,
          isScrolledLeft: scrollLeft === 0,
          isScrolledRight: scrollLeft >= scrollWidth - clientWidth,
          isScrolledTop: scrollTop === 0,
          isScrolledBottom: scrollTop >= scrollHeight - clientHeight,
          left: scrollLeft,
          top: scrollTop,
        }
        setState(scrollState)
      }
    }

    handleScroll()
    scrollContainer?.addEventListener('scroll', handleScroll)
    return () => scrollContainer?.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    ref,
    state,
    scrollLeft,
    scrollRight,
    scrollBottom,
    scrollTop,
    scrollToTarget,
  }
}
