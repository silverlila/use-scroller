'use client'

import { useRef, useState, useMemo } from 'react'
import { createScroller } from '../scroller'
import {
  ScrollOptions,
  EasingScrollOptions,
  MomentumScrollOptions,
  NativeScrollOptions,
} from '../types'
import { getElement } from '../utils'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'
import { defaultScrollOptions } from '../constants'

/**
 * Hook accepts partial scroll options - all properties are optional except 'animation' discriminant
 * This allows users to override specific properties while keeping defaults
 */
export type UseScrollOptions =
  | Partial<EasingScrollOptions>
  | (Partial<Omit<MomentumScrollOptions, 'animation'>> & { animation: 'momentum' })
  | (Partial<Omit<NativeScrollOptions, 'animation'>> & { animation: 'native' })

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

export function useScroll<T extends HTMLElement = HTMLDivElement>(props?: UseScrollOptions) {
  const ref = useRef<T>(null)

  const propsJson = JSON.stringify(props)
  const scrollOpt = useMemo(() => {
    if (!props) return defaultScrollOptions

    return { ...defaultScrollOptions, ...props } as ScrollOptions
  }, [propsJson])

  const scrollerRef = useRef<ReturnType<typeof createScroller> | null>(null)
  const [state, setState] = useState(() => initialState)

  useIsoMorphicEffect(() => {
    const scrollContainer = ref.current
    if (!scrollContainer) return

    const container = getElement(ref)
    scrollerRef.current = createScroller(container, scrollOpt)

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
        setState((prevState) => ({ ...prevState, ...scrollState }))
      }
    }

    handleScroll()
    scrollContainer?.addEventListener('scroll', handleScroll)
    return () => scrollContainer?.removeEventListener('scroll', handleScroll)
  }, [scrollOpt])

  const methods = useMemo(
    () => ({
      scrollLeft: (offset?: number) => scrollerRef.current?.scrollToLeft(offset),
      scrollRight: (offset?: number) => scrollerRef.current?.scrollToRight(offset),
      scrollTop: (offset?: number) => scrollerRef.current?.scrollToTop(offset),
      scrollBottom: (offset?: number) => scrollerRef.current?.scrollToBottom(offset),
      scrollCenter: () => scrollerRef.current?.scrollToCenter(),
      scrollTo: (position: number) => scrollerRef.current?.scrollTo(position),
      cancelScroll: () => scrollerRef.current?.cancelScroll(),
    }),
    []
  )

  return {
    ref,
    state,
    ...methods,
  }
}
