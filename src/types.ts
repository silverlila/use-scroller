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
