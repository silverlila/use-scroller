import { useCallback, useState } from 'react'
import { createScroller } from '../scroller'
import { ScrollOptions } from '../types'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'
import { defaultScrollOptions, resolveScrollValues } from '../utils'

export function useWindowScroll(props?: Partial<Omit<ScrollOptions, 'direction'>>) {
  const [state, setState] = useState(() => ({
    left: 0,
    top: 0,
    isScrolledTop: false,
    isScrolledBottom: false,
  }))

  const container = window
  const scrollOptions = { ...defaultScrollOptions, ...props }

  const scrollContainer = createScroller(container, scrollOptions)

  const handleScroll = useCallback(() => {
    const { scrollLeft, scrollTop, clientHeight, scrollHeight } = resolveScrollValues(container)

    const isAtTopBoundary = scrollTop === 0
    const isAtBottomBoundary = scrollTop >= scrollHeight - clientHeight

    const scrollState = {
      left: scrollLeft,
      top: scrollTop,
      isScrolledTop: isAtTopBoundary,
      isScrolledBottom: isAtBottomBoundary,
    }

    setState(scrollState)
  }, [container])

  useIsoMorphicEffect(() => {
    handleScroll()
    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const scrollTo = useCallback(
    (position: number) => {
      scrollContainer.scrollTo(position)
    },
    [scrollContainer]
  )

  const scrollToTarget = useCallback(
    (currentTarget: HTMLElement) => {
      scrollContainer.scrollToTarget(currentTarget)
    },
    [scrollContainer]
  )

  const scrollTop = useCallback(
    (offset?: number | undefined) => {
      scrollContainer.scrollToTop(offset)
    },
    [scrollContainer]
  )

  const scrollBottom = useCallback(
    (offset?: number | undefined) => {
      scrollContainer.scrollToBottom(offset)
    },
    [scrollContainer]
  )

  return { state, scrollTop, scrollBottom, scrollToTarget, scrollTo }
}
