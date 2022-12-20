export type ScrollerProps = {
  element: HTMLElement
  opt?: ScrollToOptions
}

export const scroller = ({ element, opt = {} }: ScrollerProps) => {
  const { scrollLeft, scrollTop, clientWidth, clientHeight } = element

  const options: ScrollToOptions = {
    behavior: 'smooth',
    ...opt,
  }

  const scrollToLeft = (offset?: number) => {
    const scrollPosition = offset || scrollLeft - clientWidth
    element.scrollTo({ ...options, left: scrollPosition })
  }

  const scrollToRight = (offset?: number) => {
    const scrollPosition = offset || scrollLeft + clientWidth
    element.scrollTo({ ...options, left: scrollPosition })
  }

  const scrollToTop = (offset?: number) => {
    const scrollPosition = offset || scrollTop - clientHeight
    element.scrollTo({ ...options, top: scrollPosition })
  }

  const scrollToBottom = (offset?: number) => {
    const scrollPosition = offset || scrollTop + clientHeight
    element.scrollTo({ ...options, top: scrollPosition })
  }

  const scrollToCenter = (currentTarget: HTMLElement) => {
    const { width, left } = currentTarget.getBoundingClientRect()
    let divider = 1

    if (clientWidth < window.innerWidth) {
      divider = window.innerWidth / clientWidth
    }
    const leftXOffset = (clientWidth - width) / 2
    const offsetDelta = (left - leftXOffset) / divider

    const scrollPosition = scrollLeft + offsetDelta
    element.scrollTo({ ...options, left: scrollPosition })
  }

  const scrollIntoView = (currentTarget: HTMLElement) => {
    const {
      left: containerLeft,
      right: containerRigh,
      top: containerTop,
      bottom: containerBottom,
    } = element.getBoundingClientRect()
    const {
      height: targetHeight,
      width: targetWidth,
      left: targetLeft,
      right: targetRight,
      top: targetTop,
      bottom: targetBottom,
    } = currentTarget.getBoundingClientRect()

    const shouldLeftScroll = containerLeft + targetWidth > targetLeft
    const shouldRightScroll = containerRigh - targetWidth < targetRight
    const shouldTopScroll = containerTop + targetHeight > targetTop
    const shouldBottomScroll = containerBottom - targetHeight < targetBottom

    const rigthScrollOffset = targetRight - containerRigh
    const leftScrollOffset = targetLeft - containerLeft
    const topScrollOffset = Math.abs(targetTop) - containerTop
    const bottomScrollOffset = Math.abs(targetBottom) - containerBottom

    if (shouldRightScroll) {
      element.scrollTo({
        left: scrollLeft + rigthScrollOffset,
        behavior: 'smooth',
      })
    }
    if (shouldLeftScroll) {
      element.scrollTo({
        left: scrollLeft - leftScrollOffset,
        behavior: 'smooth',
      })
    }
    if (shouldTopScroll) {
      element.scrollTo({
        top: scrollTop - topScrollOffset,
        behavior: 'smooth',
      })
    }
    if (shouldBottomScroll) {
      element.scrollTo({
        top: scrollTop + bottomScrollOffset,
        behavior: 'smooth',
      })
    }
  }

  return {
    scrollToLeft,
    scrollToRight,
    scrollToTop,
    scrollToBottom,
    scrollToCenter,
    scrollIntoView,
  }
}
