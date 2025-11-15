'use client'
import { useRef, useState, useMemo } from 'react'
import { createScroller } from '../scroller'
import {
  ScrollOptions,
  EasingScrollOptions,
  MomentumScrollOptions,
  NativeScrollOptions,
} from '../types'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'
import { resolveScrollValues } from '../browser'
import { defaultScrollOptions } from '../constants'

export type UseWindowScrollOptions =
  | Partial<Omit<EasingScrollOptions, 'direction'>>
  | (Partial<Omit<MomentumScrollOptions, 'animation' | 'direction'>> & { animation: 'momentum' })
  | (Partial<Omit<NativeScrollOptions, 'animation' | 'direction'>> & { animation: 'native' })

export function useWindowScroll(props?: UseWindowScrollOptions) {
  const [state, setState] = useState(() => ({
    left: 0,
    top: 0,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))

  const propsJson = JSON.stringify(props)
  const scrollOptions = useMemo(() => {
    if (!props) return defaultScrollOptions

    return { ...defaultScrollOptions, ...props, direction: 'vertical' } as ScrollOptions
  }, [propsJson])

  const scrollerRef = useRef<ReturnType<typeof createScroller> | null>(null)

  useIsoMorphicEffect(() => {
    scrollerRef.current = createScroller(window, scrollOptions)

    const handleScroll = () => {
      const { scrollLeft, scrollTop, clientHeight, scrollHeight } = resolveScrollValues(window)

      const isAtTopBoundary = scrollTop === 0
      const isAtBottomBoundary = scrollTop >= scrollHeight - clientHeight

      const scrollState = {
        left: scrollLeft,
        top: scrollTop,
        isScrolledTop: isAtTopBoundary,
        isScrolledBottom: isAtBottomBoundary,
      }

      setState(scrollState)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrollOptions])

  const methods = useMemo(
    () => ({
      scrollTo: (position: number) => scrollerRef.current?.scrollTo(position),
      scrollToTarget: (currentTarget: HTMLElement | null) => {
        if (currentTarget === null) return
        scrollerRef.current?.scrollToTarget(currentTarget)
      },
      scrollTop: (offset?: number) => scrollerRef.current?.scrollToTop(offset),
      scrollBottom: (offset?: number) => scrollerRef.current?.scrollToBottom(offset),
      cancelScroll: () => scrollerRef.current?.cancelScroll(),
    }),
    []
  )

  return {
    state,
    ...methods,
  }
}
