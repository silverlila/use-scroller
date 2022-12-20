import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { scroller } from './scroller'
import { ScrollResponse } from './types'
import { getElement } from './utils'

export function useScroll<T extends HTMLElement>(): ScrollResponse<T> {
  const ref = useRef<T>(null)
  const [state, setState] = useState(() => ({
    isScrollable: false,
    isScrolledLeft: false,
    isScrolledRight: false,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))

  const scrollTargetIntoView = useCallback((currentTarget: HTMLElement) => {
    const scrollContainer = getElement(ref)
    const scroll = scroller({ element: scrollContainer })
    scroll.scrollIntoView(currentTarget)
  }, [])

  const scrollCenter = useCallback((currentTarget: HTMLElement) => {
    const scrollContainer = getElement(ref)
    const scroll = scroller({ element: scrollContainer })
    scroll.scrollToCenter(currentTarget)
  }, [])

  const scrollTop = useCallback(() => {
    const scrollContainer = getElement(ref)
    const scroll = scroller({ element: scrollContainer })
    scroll.scrollToTop()
  }, [])

  const scrollBottom = useCallback(() => {
    const scrollContainer = getElement(ref)
    const scroll = scroller({ element: scrollContainer })
    scroll.scrollToBottom()
  }, [])

  const scrollRight = useCallback(() => {
    const scrollContainer = getElement(ref)
    const scroll = scroller({ element: scrollContainer })
    scroll.scrollToRight()
  }, [])

  const scrollLeft = useCallback(() => {
    const scrollContainer = getElement(ref)
    const scroll = scroller({ element: scrollContainer })
    scroll.scrollToLeft()
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
          isScrolledRight: scrollLeft >= scrollWidth - clientWidth - 10,
          isScrolledTop: scrollTop === 0,
          isScrolledBottom: scrollTop >= scrollHeight - clientHeight - 10,
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
    scrollCenter,
    scrollRight,
    scrollTop,
    scrollBottom,
    scrollLeft,
    scrollTargetIntoView,
  }
}
