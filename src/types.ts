import React from 'react'

export interface ScrollResponse {
  elementRef: React.RefObject<HTMLElement>
  isScrollable: boolean
  isScrolledLeft: boolean
  isScrolledRight: boolean
  scrollToCenter: (target: HTMLElement) => void
  scrollElementIntoView: (target: HTMLElement) => void
  scrollToRight: () => void
  scrollToLeft: () => void
}

export type RenderFunction = (props: ScrollResponse) => React.ReactNode
