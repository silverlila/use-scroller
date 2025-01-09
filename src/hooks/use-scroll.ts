import { useRef, useState } from 'react'
import { createScroller } from '../scroller'
import { ScrollOptions } from '../types'
import { defaultScrollOptions, getElement } from '../utils'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'

const initialState = {
  left: 0, 
  top: 0, 
  isScrollable: false, 
  isScrolledLeft: true, 
  isScrolledRight: false, 
  isScrolledTop: true, 
  isScrolledBottom: false, 
  maxScrollLeft: 0, 
  maxScrollTop: 0, 
  scrollPercentageX: 0, 
  scrollPercentageY: 0, 
}

export function useScroll<T extends HTMLElement>(props?: Partial<ScrollOptions>) {
  const ref = useRef<T>(null)
  const scrollOpt = { ...defaultScrollOptions, ...props }
  const scrollerRef = useRef<ReturnType<typeof createScroller> | null>(null)
  const [state, setState] = useState(() => initialState)

  useIsoMorphicEffect(() => {
    const scrollContainer = ref.current
    if (!scrollContainer) return

    if (!scrollerRef.current) {
      const container = getElement(ref)
      scrollerRef.current = createScroller(container, scrollOpt)
    }

    const { scrollWidth, clientWidth, clientHeight, scrollHeight } = scrollContainer
    const isScrollable = clientWidth !== scrollWidth || clientHeight !== scrollHeight
    setState((prev) => ({ ...prev, isScrollable }))

    const handleScroll = () => {
      if (scrollContainer) {
        const { scrollLeft, scrollTop } = scrollContainer
        const isAtLeftBoundary = scrollLeft === 0
        const isAtRightBoundary = scrollLeft >= scrollWidth - clientWidth
        const isAtTopBoundary = scrollTop === 0
        const isAtBottomBoundary = scrollTop >= scrollHeight - clientHeight
        const scrollState = {
          ...state,
          isScrolledLeft: isAtLeftBoundary,
          isScrolledRight: isAtRightBoundary,
          isScrolledTop: isAtTopBoundary,
          isScrolledBottom: isAtBottomBoundary,
          left: scrollLeft,
          top: scrollTop,
          maxScrollLeft: scrollWidth - clientWidth,
          maxScrollTop: scrollHeight - clientHeight,
          scrollPercentageX: isAtLeftBoundary
            ? 0
            : (scrollLeft / (scrollWidth - clientWidth)) * 100,
          scrollPercentageY: isAtTopBoundary
            ? 0
            : (scrollTop / (scrollHeight - clientHeight)) * 100,
        }
        setState(scrollState)
      }
    }

    handleScroll()
    scrollContainer?.addEventListener('scroll', handleScroll)
    return () => scrollContainer?.removeEventListener('scroll', handleScroll)
  }, [state])

  return {
    ref,
    state,
    scrollLeft: scrollerRef.current?.scrollToLeft,
    scrollRight: scrollerRef.current?.scrollToRight,
    scrollBottom: scrollerRef.current?.scrollToBottom,
    scrollTop: scrollerRef.current?.scrollToTop,
    scrollCenter: scrollerRef.current?.scrollToCenter,
    scrollTo: scrollerRef.current?.scrollTo,
  }
}
