import type { RefObject } from 'react'
import { scrollHandoff, type ScrollHandoffOptions } from '../core'
import { isWindow } from '../core/geometry'
import { useElementEffect } from './use-element-effect'

export function useScrollHandoff(
  ref: RefObject<HTMLElement | null>,
  { axis = 'y', parent }: ScrollHandoffOptions = {}
): void {
  useElementEffect(
    ref,
    (element) => {
      if (isWindow(element)) throw new Error('useScrollHandoff: ref must point at an element')
      return scrollHandoff(element, { axis, parent })
    },
    [axis, parent]
  )
}
