import React from 'react'
import { RenderFunction } from './types'
import { useScroll } from './useScroll'
import { isFunction } from './utils'

export interface Props {
  children?: RenderFunction | React.ReactNode | JSX.Element
}
export function ScrollableContainer({ children }: Props) {
  const scroll = useScroll<HTMLDivElement>()

  return (
    <div ref={scroll.ref}>
      {children && isFunction(children) ? (children as any)(scroll) : children}
    </div>
  )
}
