import React from 'react'

export type ScrollResponse<T> = {
  ref: React.RefObject<T>
  state: {
    isScrollable: boolean
    isScrolledLeft: boolean
    isScrolledRight: boolean
    isScrolledTop: boolean
    isScrolledBottom: boolean
  }
  scrollRight: () => void
  scrollLeft: () => void
  scrollTop: () => void
  scrollBottom: () => void
  scrollTargetIntoView: (element: HTMLElement) => void
  scrollCenter: (element: HTMLElement) => void
}
export type ScrollProps = {
  direction?: 'horizontal' | 'vertical'
}

export type RenderFunction = (props: ScrollResponse<HTMLElement>) => React.ReactNode
