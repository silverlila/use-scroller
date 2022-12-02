import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export function useScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  const [isScrollable, setIsScrollable] = useState(false)
  const [isScrolledRight, setIsScrolledRight] = useState(false)
  const [isScrolledLeft, setIsScrolledLeft] = useState(false)

  /**
   * Scrolls the element into view
   * if it's not fully in view.
   *
   * @params currentTarget: HTMLElement
   */
  const scrollElementIntoView = useCallback((currentTarget: HTMLElement) => {
    const tabsElement = ref.current

    if (!tabsElement) return
    const { scrollLeft } = tabsElement

    const tabsElementRect = tabsElement.getBoundingClientRect()
    const selectedElementRect = currentTarget.getBoundingClientRect()

    const shouldLeftScroll = tabsElementRect.left > selectedElementRect.left
    const shouldRightScroll = tabsElementRect.right < selectedElementRect.right

    if (shouldRightScroll) {
      tabsElement.scrollTo({
        left: scrollLeft + 120,
        behavior: 'smooth',
      })
    }
    if (shouldLeftScroll) {
      tabsElement.scrollTo({
        left: scrollLeft - 120,
        behavior: 'smooth',
      })
    }
  }, [])

  /**
   * Scrolls the element to
   * the center of the screen.
   *
   * @params currentTarget: HTMLElement
   */
  const scrollToCenter = useCallback((currentTarget: HTMLElement) => {
    const tabsElement = ref.current

    if (!tabsElement) return
    const { scrollLeft } = tabsElement

    const targetRect = currentTarget.getBoundingClientRect()

    const leftXOffset = (window.innerWidth - targetRect.width) / 2
    const offsetDelta = targetRect.left - leftXOffset

    const newScrollPosition = scrollLeft + offsetDelta

    tabsElement.scrollTo({
      behavior: 'auto',
      left: newScrollPosition,
    })
  }, [])

  /**
   * Scrolls the container to
   * the right by half its width.
   */
  const scrollToRight = useCallback(() => {
    const tabsElement = ref.current

    if (!tabsElement) return
    const { scrollLeft, clientWidth } = tabsElement
    const scrollDistance = scrollLeft + clientWidth / 2

    tabsElement.scrollTo({ behavior: 'smooth', left: scrollDistance })
  }, [])

  /**
   * Scrolls the container to
   * the left by half its width.
   */
  const scrollToLeft = useCallback(() => {
    const tabsElement = ref.current
    if (!tabsElement) return
    const { scrollLeft, clientWidth } = tabsElement
    const scrollDistance = scrollLeft - clientWidth / 2

    tabsElement.scrollTo({ behavior: 'smooth', left: scrollDistance })
  }, [])

  useLayoutEffect(() => {
    const tabsElement = ref.current
    if (!tabsElement) return

    const { scrollWidth, clientWidth } = tabsElement
    setIsScrollable(clientWidth !== scrollWidth)

    const handleScroll = () => {
      if (tabsElement) {
        const { scrollLeft } = tabsElement
        setIsScrolledLeft(scrollLeft === 0)
        setIsScrolledRight(scrollLeft >= scrollWidth - clientWidth - 10)
      }
    }

    handleScroll()
    tabsElement?.addEventListener('scroll', handleScroll)
    return () => tabsElement?.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    ref,
    isScrollable,
    isScrolledLeft,
    isScrolledRight,
    scrollToCenter,
    scrollToRight,
    scrollToLeft,
    scrollElementIntoView,
  }
}
