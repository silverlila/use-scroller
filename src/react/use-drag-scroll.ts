import type { RefObject } from 'react'
import { dragScroll, type DragScrollOptions } from '../core'
import { isWindow } from '../core/geometry'
import { useElementEffect } from './use-element-effect'

export function useDragScroll(
  ref: RefObject<HTMLElement | null>,
  { axis = 'x', mouse = false }: DragScrollOptions = {}
): void {
  useElementEffect(
    ref,
    (element) => {
      if (isWindow(element)) throw new Error('useDragScroll: ref must point at an element')
      return dragScroll(element, { axis, mouse })
    },
    [axis, mouse]
  )
}
