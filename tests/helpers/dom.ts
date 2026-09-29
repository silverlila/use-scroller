import { onTestFinished } from 'vitest'

interface Size {
  width: number
  height: number
}

export function mount<T extends HTMLElement>(element: T): T {
  document.body.append(element)
  onTestFinished(() => element.remove())
  return element
}

export function createBox(size: Size, style: Partial<CSSStyleDeclaration> = {}): HTMLDivElement {
  const box = document.createElement('div')
  Object.assign(box.style, { width: `${size.width}px`, height: `${size.height}px` }, style)
  return box
}

export function createScroller(
  viewport: Size,
  content: Size,
  style: Partial<CSSStyleDeclaration> = {}
): HTMLDivElement {
  const scroller = createBox(viewport, { overflow: 'auto', scrollbarWidth: 'none', ...style })
  scroller.append(createBox(content))
  return scroller
}

export function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

export function mountPage(content: Size): void {
  const previousMargin = document.body.style.margin
  document.body.style.margin = '0'
  mount(createBox(content))
  onTestFinished(() => {
    document.body.style.margin = previousMargin
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' })
  })
}

export function setInlineStyle(element: HTMLElement, cssText: string): void {
  const previous = element.style.cssText
  element.style.cssText = cssText
  onTestFinished(() => {
    element.style.cssText = previous
  })
}

// Declaration order in cssText is not meaningful, so compare property by property.
export function inlineDeclarations(element: HTMLElement): Record<string, string> {
  return Object.fromEntries(
    Array.from(element.style, (property) => {
      const priority = element.style.getPropertyPriority(property)
      const value = element.style.getPropertyValue(property)
      return [property, priority ? `${value} !${priority}` : value]
    })
  )
}
