import { useCallback, useLayoutEffect, useState } from 'react'
import { scroller } from './scroller'
import { ScrollProps } from './types'
import { resolveScrollValues } from './utils'

export function useWindowScroll({ direction = 'vertical', duration = 300 }: ScrollProps) {
  const [state, setState] = useState(() => ({
    left: 0,
    top: 0,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))
  const props = { direction, duration }

  const scrollTop = useCallback((offset?: number | undefined) => {
    const scrollContainer = scroller({ ...props, container: window })
    scrollContainer.scrollToTop(offset)
  }, [])

  const scrollBottom = useCallback((offset?: number | undefined) => {
    const scrollContainer = scroller({ ...props, container: window })
    scrollContainer.scrollToBottom(offset)
  }, [])

  useLayoutEffect(() => {
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

  return { state, scrollTop, scrollBottom }
}
