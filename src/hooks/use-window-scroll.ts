import { useCallback, useState } from 'react'
import { scroller } from '../scroller'
import { ScrollerProps, ScrollOptions } from '../types'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'
import { defaultScrollOptions, resolveScrollValues } from '../utils'

export function useWindowScroll(props?: Partial<Omit<ScrollOptions, 'direction'>>) {
  const [state, setState] = useState(() => ({
    left: 0,
    top: 0,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))

  const scrollArgs: ScrollerProps = {
    container: window,
    options: { ...defaultScrollOptions, ...props },
  }
  const scrollTo = useCallback((position: number) => {
    const scrollContainer = scroller(scrollArgs)
    scrollContainer.scrollTo(position)
  }, [])

  const scrollToTarget = useCallback((currentTarget: HTMLElement) => {
    const scrollContainer = scroller(scrollArgs)
    scrollContainer.scrollToTarget(currentTarget)
  }, [])

  const scrollTop = useCallback((offset?: number | undefined) => {
    const scrollContainer = scroller(scrollArgs)
    scrollContainer.scrollToTop(offset)
  }, [])

  const scrollBottom = useCallback((offset?: number | undefined) => {
    const scrollContainer = scroller(scrollArgs)
    scrollContainer.scrollToBottom(offset)
  }, [])

  useIsoMorphicEffect(() => {
    const handleScroll = () => {
      if (window) {
        const { scrollLeft, scrollTop, scrollHeight, clientHeight } = resolveScrollValues(window)
        const scrollState = {
          ...state,
          isScrolledTop: scrollTop === 0,
          isScrolledBottom: scrollTop >= scrollHeight - clientHeight,
          left: scrollLeft,
          top: scrollTop,
        }
        setState(scrollState)
      }
    }

    handleScroll()
    window?.addEventListener('scroll', handleScroll)
    return () => window?.removeEventListener('scroll', handleScroll)
  }, [])

  return { state, scrollTop, scrollBottom, scrollToTarget, scrollTo }
}
