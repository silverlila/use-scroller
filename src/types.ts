import { RefObject } from 'react'

export type ScrollResponse<T> = {
  ref: RefObject<T | HTMLElement | Window>
  state: {
    isScrollable: boolean
    isScrolledLeft: boolean
    isScrolledRight: boolean
    isScrolledTop: boolean
    isScrolledBottom: boolean
    left: number
    top: number
  }
  scrollRight: (offset?: number | undefined) => void
  scrollLeft: (offset?: number | undefined) => void
  scrollTop: (offset?: number | undefined) => void
  scrollBottom: (offset?: number | undefined) => void
  scrollToTarget: (element: HTMLElement) => void
}

export type ScrollerProps = {
  container: HTMLElement | Window
  direction?: 'horizontal' | 'vertical'
  duration?: number
}

export type ScrollProps = {
  container?: HTMLElement | Window | undefined
  direction?: 'horizontal' | 'vertical'
  duration?: number
}
