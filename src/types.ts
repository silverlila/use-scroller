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

export type ScrollOptions = {
  direction: 'horizontal' | 'vertical'
  duration: number
  easingOption: EasingOptions
}

export type ScrollerProps = {
  container: HTMLElement | Window
  options: ScrollOptions
}

export type EasingOptions = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export type EasingFunction = (t: number) => number

export interface EasingFunctions {
  linear: EasingFunction
  'ease-in': EasingFunction
  'ease-out': EasingFunction
  'ease-in-out': EasingFunction
}
