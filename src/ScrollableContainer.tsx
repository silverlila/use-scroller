import { ScrollResponse } from './types'
import { useScroll } from './useScroll'

export interface ScrollableContainerProps {
  children(args?: ScrollResponse<HTMLElement>): JSX.Element
}
export function ScrollableContainer({ children }: ScrollableContainerProps) {
  const scroll = useScroll<HTMLDivElement>()
  return children(scroll)
}
