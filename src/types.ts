import { RefObject } from 'react'

export type EasingOptions = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

type BaseScrollOptions = {
  direction: 'horizontal' | 'vertical'
  respectMotionPreference?: boolean
}

export type EasingScrollOptions = BaseScrollOptions & {
  animation: 'easing'
  easing: EasingOptions
  duration: number
}

export type MomentumScrollOptions = BaseScrollOptions & {
  animation: 'momentum'
  friction: number
  duration: number
}

export type NativeScrollOptions = BaseScrollOptions & {
  animation: 'native'
  behavior?: 'smooth' | 'auto'
}

export type ScrollOptions = EasingScrollOptions | MomentumScrollOptions | NativeScrollOptions

export type ScrollState = {
  left: number
  top: number
  isScrollable: boolean

  isScrolledLeft: boolean
  isScrolledRight: boolean
  isScrolledTop: boolean
  isScrolledBottom: boolean
  maxScrollLeft: number
  maxScrollTop: number
  scrollPercentageX: number
  scrollPercentageY: number
}

export type UseScrollReturn<T extends HTMLElement> = {
  ref: RefObject<T>
  state: ScrollState
  scrollLeft: (offset?: number, useMomentum?: boolean) => void
  scrollRight: (offset?: number, useMomentum?: boolean) => void
  scrollTop: (offset?: number, useMomentum?: boolean) => void
  scrollBottom: (offset?: number, useMomentum?: boolean) => void
  scrollCenter: () => void
  scrollTo: (position: number) => void
  cancelScroll: () => void
}

export type EasingFunction = (t: number) => number

export type EasingFunctions = {
  [key in EasingOptions]: EasingFunction
}
