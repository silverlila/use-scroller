import { ScrollOptions } from './types'
import { defaultScrollOptions, getEasing, resolveScrollValues, validateElement } from './utils'

export function createScroller(
  container: HTMLElement | Window,
  options: ScrollOptions = defaultScrollOptions
) {
  validateElement(container)
  const { duration, easingOption, direction } = options
  const { scrollLeft, scrollTop, clientWidth, clientHeight, scrollWidth, scrollHeight } =
    resolveScrollValues(container)

  function scroll(from: number, to: number, layout: ScrollOptions['direction'] = direction) {
    let startTime: number | null = null
    let requestId = 0
    const distance = Math.abs(to - from)

    function calculateCurrentPosition(timeFraction: number): number {
      const easingFunc = getEasing(easingOption)
      return easingFunc(timeFraction) * distance + from
    }

    function updateScrollPosition(currentPosition: number) {
      container.scrollTo({
        left: layout === 'horizontal' ? currentPosition : undefined,
        top: layout === 'vertical' ? currentPosition : undefined,
      })
    }

    function animateScroll(currentTime: number) {
      if (!startTime) startTime = currentTime
      const elapsedTime = currentTime - startTime
      const timeFraction = elapsedTime / duration
      const currentPosition = calculateCurrentPosition(timeFraction)

      updateScrollPosition(currentPosition)

      if (timeFraction < 1) {
        requestId = requestAnimationFrame(animateScroll)
      } else {
        cancelAnimationFrame(requestId)
      }
    }

    requestId = requestAnimationFrame(animateScroll)
  }

  function scrollTo(to: number) {
    const from = direction === 'vertical' ? scrollTop : scrollLeft
    scroll(from, to)
  }

  function scrollToCenter() {
    let from = 0
    let to = 0

    if (direction === 'vertical') {
      const scrollYCenterPosition = (scrollHeight - clientHeight) / 2
      from = scrollTop
      to = scrollYCenterPosition
    }

    if (direction === 'horizontal') {
      const scrollXCenterPosition = (scrollWidth - clientWidth) / 2
      from = scrollLeft
      to = scrollXCenterPosition
    }
    scroll(from, to, direction)
  }

  function scrollToTarget(target: HTMLElement, offset = 0) {
    validateElement(target)
    const { offsetTop, offsetLeft } = target
    let from = 0
    let to = 0

    if (direction === 'vertical') {
      from = scrollTop
      to = offsetTop - offset
    }

    if (direction === 'horizontal') {
      from = scrollLeft
      to = offsetLeft - offset
    }

    scroll(from, to, direction)
  }

  return {
    scrollTo,
    scrollToCenter,
    scrollToTarget,
    scrollToLeft: (offset?: number) => {
      scroll(scrollLeft, offset || scrollLeft - clientWidth, 'horizontal')
    },
    scrollToRight: (offset?: number) => {
      scroll(scrollLeft, offset || scrollLeft + clientWidth, 'horizontal')
    },
    scrollToTop: (offset?: number) => {
      scroll(scrollTop, offset || scrollTop - clientHeight, 'vertical')
    },
    scrollToBottom: (offset?: number) => {
      scroll(scrollTop, offset || scrollTop + clientHeight, 'vertical')
    },
  }
}
