import { ScrollerProps } from './types'
import { defaultScrollOptions, getEasing, resolveScrollValues, validateElement } from './utils'

export function scroller({ container, options = defaultScrollOptions }: ScrollerProps) {
  validateElement(container)

  const { duration, easingOption, direction } = options
  const { scrollLeft, scrollTop, clientWidth, clientHeight, scrollWidth, scrollHeight } =
    resolveScrollValues(container)

  /**
   * Scroll the Element or Window to the given
   * position.
   *
   * @param {number} from the current scroll position.
   * @param {number} to the new position to scroll.
   * @param {string} layout the scroll direction.
   */
  function scrollTo(from: number, to: number, layout: 'horizontal' | 'vertical' = direction) {
    let startTime: number | null = null
    let requestId = 0

    function loop(currentTime: number) {
      if (!startTime) startTime = currentTime

      const time = Math.min((currentTime - startTime) / duration, 1)
      const easingFunc = getEasing(easingOption)
      const currentPositionInTime = easingFunc(time) * (to - from) + from

      container.scrollTo({
        left: layout === 'horizontal' ? currentPositionInTime : undefined,
        top: layout === 'vertical' ? currentPositionInTime : undefined,
      })

      if (time < 1) {
        requestId = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(requestId)
      }
    }
    requestId = requestAnimationFrame(loop)
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
    scrollTo(from, to, direction)
  }

  function scrollToTarget(target: HTMLElement) {
    validateElement(target)
    const { offsetTop, offsetLeft } = target
    let from = 0
    let to = 0

    if (direction === 'vertical') {
      from = scrollTop
      to = offsetTop
    }

    if (direction === 'horizontal') {
      from = scrollLeft
      to = offsetLeft
    }

    scrollTo(from, to, direction)
  }

  const scrollToLeft = (offset?: number) => {
    const scrollPosition = offset || scrollLeft - clientWidth
    scrollTo(scrollLeft, scrollPosition, 'horizontal')
  }

  const scrollToRight = (offset?: number) => {
    const scrollPosition = offset || scrollLeft + clientWidth
    scrollTo(scrollLeft, scrollPosition, 'horizontal')
  }

  const scrollToTop = (offset?: number) => {
    const scrollPosition = offset || scrollTop - clientHeight
    scrollTo(scrollTop, scrollPosition, 'vertical')
  }

  const scrollToBottom = (offset?: number) => {
    const scrollPosition = offset || scrollTop + clientHeight
    scrollTo(scrollTop, scrollPosition, 'vertical')
  }

  return {
    scrollToLeft,
    scrollToRight,
    scrollToTop,
    scrollToBottom,
    scrollToTarget,
    scrollToCenter,
    scrollTo,
  }
}
