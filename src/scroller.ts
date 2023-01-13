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
   * @param {number} layout the scroll direction.
   */
  function scrollTo(from: number, to: number, layout: 'horizontal' | 'vertical') {
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
    if (direction === 'horizontal') {
      const scrollXPosition = (scrollWidth - clientWidth) / 2
      scrollTo(scrollLeft, scrollXPosition, 'horizontal')
    } else {
      const scrollYPosition = (scrollHeight - clientHeight) / 2
      scrollTo(scrollTop, scrollYPosition, 'vertical')
    }
  }

  function scrollToTarget(target: HTMLElement) {
    validateElement(target)
    const { offsetTop } = target
    scrollTo(scrollTop, offsetTop, 'vertical')
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
  }
}
