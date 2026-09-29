import { useRef, useState, type RefObject } from 'react'
import {
  stickToBottom,
  type AnimateScrollOptions,
  type ScrollHandle,
  type StickToBottom,
} from '../core'
import { isWindow } from '../core/geometry'
import { useElementEffect } from './use-element-effect'

export interface StickToBottomState {
  isAtBottom: boolean
  scrollToBottom(options?: AnimateScrollOptions): ScrollHandle
}

export function useStickToBottom(target: RefObject<HTMLElement | null>): StickToBottomState {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const attached = useRef<StickToBottom | null>(null)

  useElementEffect(
    target,
    (element) => {
      if (isWindow(element)) throw new Error('useStickToBottom: target must be an element ref')
      const sticking = stickToBottom(element, setIsAtBottom)
      attached.current = sticking
      return () => {
        sticking.stop()
        if (attached.current === sticking) attached.current = null
      }
    },
    []
  )

  const [scrollToBottom] = useState(() => (options?: AnimateScrollOptions): ScrollHandle => {
    if (!attached.current) throw new Error('useStickToBottom: ref is not attached to an element')
    return attached.current.scrollToBottom(options)
  })

  return { isAtBottom, scrollToBottom }
}
