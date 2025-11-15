export const resolveScrollValues = (element: HTMLElement | Window) => {
  const isWindow = element instanceof Window
  const docElement = document.documentElement

  // For window scrolling, use document.documentElement for scroll dimensions
  // and window.innerWidth/innerHeight for viewport dimensions
  const scrollLeftMax = isWindow
    ? Math.max(docElement.scrollWidth - window.innerWidth, 0)
    : element.scrollWidth - element.clientWidth
  const scrollTopMax = isWindow
    ? Math.max(docElement.scrollHeight - window.innerHeight, 0)
    : element.scrollHeight - element.clientHeight

  return {
    scrollLeft: isWindow ? window.pageXOffset || docElement.scrollLeft : element.scrollLeft,
    scrollTop: isWindow ? window.pageYOffset || docElement.scrollTop : element.scrollTop,
    scrollWidth: isWindow ? docElement.scrollWidth : element.scrollWidth,
    clientWidth: isWindow ? window.innerWidth : element.clientWidth,
    clientHeight: isWindow ? window.innerHeight : element.clientHeight,
    scrollHeight: isWindow ? docElement.scrollHeight : element.scrollHeight,
    scrollLeftMax,
    scrollTopMax,
  }
}

export function validateElement(element?: HTMLElement | Window) {
  if (element === undefined) {
    throw new Error(`The element passed to scroller() was undefined`)
  }
  if (!(element instanceof HTMLElement || Window)) {
    throw new TypeError(
      `
      The element passed to scroller() must be a valid element. 
      You passed ${element}.
      `
    )
  }
}
