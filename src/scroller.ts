import { ScrollOptions } from './types'
import { prefersReducedMotion } from './utils'
import {
  createEasingAnimation,
  createMomentumAnimation,
  AnimationController,
} from './animation-engine'
import { resolveScrollValues, validateElement } from './browser'
import { defaultScrollOptions } from './constants'

function createScrollToOptions(
  layout: ScrollOptions['direction'],
  position: number
): ScrollToOptions {
  if (layout === 'vertical') {
    return { top: position }
  } else {
    return { left: position }
  }
}

/**
 * Creates a scroller instance with smooth scrolling capabilities
 *
 * @example
 * ```typescript
 * const scroller = createScroller(element, {
 *   animation: 'easing',
 *   direction: 'vertical',
 *   duration: 300,
 *   easing: 'ease-out'
 * })
 *
 * scroller.scrollToBottom()
 * scroller.cancelScroll()
 * ```
 */
export function createScroller(
  container: HTMLElement | Window,
  options: ScrollOptions = defaultScrollOptions
) {
  validateElement(container)
  const { direction, respectMotionPreference } = options

  // Track active animation controller for cancellation
  let activeAnimation: AnimationController | null = null

  function getCurrentScrollValues() {
    return resolveScrollValues(container)
  }

  function cancelScroll() {
    if (activeAnimation) {
      activeAnimation.cancel()
      activeAnimation = null
    }
  }

  /**
   * Clamps a scroll position to valid bounds
   * Prevents scrolling past the edges of the scrollable area
   */
  function clampPosition(position: number, layout: ScrollOptions['direction']): number {
    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = getCurrentScrollValues()
    if (layout === 'horizontal') {
      const maxScroll = scrollWidth - clientWidth
      return Math.max(0, Math.min(position, maxScroll))
    } else {
      const maxScroll = scrollHeight - clientHeight
      return Math.max(0, Math.min(position, maxScroll))
    }
  }

  /**
   * Core scroll function - handles different animation types
   *
   * @param from - Starting scroll position
   * @param to - Target scroll position
   * @param layout - Scroll direction ('horizontal' or 'vertical')
   * @param useMomentum - Whether to force momentum-based animation
   */
  function scroll(from: number, to: number, layout: ScrollOptions['direction'] = direction) {
    // Cancel any existing animation before starting new one
    cancelScroll()

    // Clamp target position to valid bounds
    const clampedTo = clampPosition(to, layout)
    console.log('scroll called:', { from, to, layout, clampedTo })

    // Check if user prefers reduced motion - if so, scroll instantly (accessibility)
    if (respectMotionPreference && prefersReducedMotion()) {
      console.log('Using instant scroll (reduced motion)')
      container.scrollTo(createScrollToOptions(layout, clampedTo))
      return
    }

    /**
     * Update callback for animation engine
     * Called every frame with the current scroll position
     */
    function updateScrollPosition(position: number) {
      const scrollOptions = createScrollToOptions(layout, position)
      container.scrollTo(scrollOptions)
    }

    if (options.animation === 'native') {
      container.scrollTo({
        ...createScrollToOptions(layout, clampedTo),
        behavior: options.behavior || 'smooth',
      })
      return
    }

    if (options.animation === 'momentum') {
      console.log('Creating momentum animation')
      // Physics-based momentum animation with exponential decay
      activeAnimation = createMomentumAnimation({
        from,
        to: clampedTo,
        friction: options.friction,
        duration: options.duration,
        onUpdate: updateScrollPosition,
        onComplete: () => {
          activeAnimation = null
        },
      })
    } else if (options.animation === 'easing') {
      console.log('Creating easing animation:', {
        from,
        to: clampedTo,
        duration: options.duration,
        easing: options.easing,
      })
      // Time-based easing animation
      activeAnimation = createEasingAnimation({
        from,
        to: clampedTo,
        duration: options.duration,
        easing: options.easing,
        onUpdate: updateScrollPosition,
        onComplete: () => {
          activeAnimation = null
        },
      })
    }
  }

  return {
    cancelScroll,

    scrollTo(to: number) {
      const { scrollTop, scrollLeft } = getCurrentScrollValues()
      const from = direction === 'vertical' ? scrollTop : scrollLeft
      scroll(from, to)
    },

    scrollToCenter() {
      const { scrollTop, scrollLeft, scrollWidth, scrollHeight, clientWidth, clientHeight } =
        getCurrentScrollValues()
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
    },

    scrollToTarget(target: HTMLElement, offset = 0) {
      validateElement(target)
      const { scrollTop, scrollLeft } = getCurrentScrollValues()

      let from = 0
      let to = 0

      if (container instanceof Window) {
        // For window scrolling, use element's position from document top
        // getBoundingClientRect gives position relative to viewport
        // Adding current scroll position gives position from document top
        const targetRect = target.getBoundingClientRect()

        if (direction === 'vertical') {
          from = scrollTop
          to = targetRect.top + scrollTop - offset
        } else if (direction === 'horizontal') {
          from = scrollLeft
          to = targetRect.left + scrollLeft - offset
        }
      } else {
        // For element scrolling, calculate relative to container
        const targetRect = target.getBoundingClientRect()
        const containerRect = (container as HTMLElement).getBoundingClientRect()

        if (direction === 'vertical') {
          from = scrollTop
          to = targetRect.top - containerRect.top + scrollTop - offset
        } else if (direction === 'horizontal') {
          from = scrollLeft
          to = targetRect.left - containerRect.left + scrollLeft - offset
        }
      }
      console.log({ from, to, direction, options })

      scroll(from, to, direction)
    },

    scrollToLeft: (offset?: number) => {
      const { scrollLeft } = getCurrentScrollValues()
      const from = scrollLeft
      const to = offset !== undefined ? offset : 0
      scroll(from, to, 'horizontal')
    },

    scrollToRight: (offset?: number) => {
      const { scrollLeft, scrollWidth, clientWidth } = getCurrentScrollValues()
      const from = scrollLeft
      const to = offset !== undefined ? offset : scrollWidth - clientWidth
      scroll(from, to, 'horizontal')
    },

    scrollToTop: (offset?: number) => {
      const { scrollTop } = getCurrentScrollValues()
      const from = scrollTop
      const to = offset !== undefined ? offset : 0
      scroll(from, to, 'vertical')
    },

    scrollToBottom: (offset?: number) => {
      const { scrollTop, scrollTopMax } = getCurrentScrollValues()
      const from = scrollTop
      const to = offset !== undefined ? offset : scrollTopMax
      scroll(from, to, 'vertical')
    },
  }
}
