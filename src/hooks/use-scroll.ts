import { useCallback, useRef, useState } from 'react'
import { scroller } from '../scroller'
import { ScrollOptions } from '../types'
import { defaultScrollOptions, getElement } from '../utils'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'

export function useScroll<T extends HTMLElement>(props?: Partial<ScrollOptions>) {
  const ref = useRef<T>(null)
  const [state, setState] = useState(() => ({
    left: 0,
    top: 0,
    isScrollable: false,
    isScrolledLeft: false,
    isScrolledRight: false,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))
  const scrollOpt = { ...defaultScrollOptions, ...props }

  const scrollTo = useCallback((position: number) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ container, options: scrollOpt })
    scrollContainer.scrollTo(position)
  }, [])

  const scrollCenter = useCallback(() => {
    const container = getElement(ref)
    const scrollContainer = scroller({ container, options: scrollOpt })
    scrollContainer.scrollToCenter()
  }, [])

  const scrollTop = useCallback((offset?: number) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ container, options: scrollOpt })
    scrollContainer.scrollToTop(offset)
  }, [])

  const scrollBottom = useCallback((offset?: number) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ container, options: scrollOpt })
    scrollContainer.scrollToBottom(offset)
  }, [])

  const scrollRight = useCallback((offset?: number) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ container, options: scrollOpt })
    scrollContainer.scrollToRight(offset)
  }, [])

  const scrollLeft = useCallback((offset?: number) => {
    const container = getElement(ref)
    const scrollContainer = scroller({ container, options: scrollOpt })
    scrollContainer.scrollToLeft(offset)
  }, [])

  useIsoMorphicEffect(() => {
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
    scrollCenter,
    scrollTo,
  }
}
