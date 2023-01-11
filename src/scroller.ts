import { ScrollerProps } from './types'
import { resolveScrollValues, validateElement } from './utils'

export function scroller({ container, direction = 'horizontal', duration = 300 }: ScrollerProps) {
  validateElement(container)

  const { scrollLeft, scrollTop, clientWidth, clientHeight } = resolveScrollValues(container)

  function scrollTo(from: number, to: number, layout: 'horizontal' | 'vertical') {
    let startTime: number | null = null
    let requestId = 0

    function loop(currentTime: number) {
      if (!startTime) {
        startTime = currentTime
      }

      const time = currentTime - startTime
      const percent = Math.min(time / duration, 1)
      const position = from + to * percent

      container.scrollTo({
        left: layout === 'horizontal' ? position : undefined,
        top: layout === 'vertical' ? position : undefined,
      })

      if (time < duration) {
        requestId = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(requestId)
      }
    }
    requestId = requestAnimationFrame(loop)
  }

  function scrollToTarget(target: HTMLElement) {
    function scrollToTargetY() {
      const { top } = target.getBoundingClientRect()
      scrollTo(scrollTop, top, 'horizontal')
    }
    function scrollToTargetX() {
      const { left } = target.getBoundingClientRect()
      scrollTo(scrollLeft, left, 'horizontal')
    }
    if (direction == 'vertical') {
      scrollToTargetY()
    } else {
      scrollToTargetX()
    }
  }

  const scrollToLeft = (offset?: number) => {
    const scrollPosition = offset || -clientWidth
    scrollTo(scrollLeft, scrollPosition, 'horizontal')
  }

  const scrollToRight = (offset?: number) => {
    const scrollPosition = offset || clientWidth
    scrollTo(scrollLeft, scrollPosition, 'horizontal')
  }

  const scrollToTop = (offset?: number) => {
    const scrollPosition = offset || -clientHeight
    scrollTo(scrollTop, scrollPosition, 'vertical')
  }

  const scrollToBottom = (offset?: number) => {
    const scrollPosition = offset || clientHeight
    scrollTo(scrollTop, scrollPosition, 'vertical')
  }

  return {
    scrollToLeft,
    scrollToRight,
    scrollToTop,
    scrollToBottom,
    scrollToTarget,
  }
}
