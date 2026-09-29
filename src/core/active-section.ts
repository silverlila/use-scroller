import { isWindow } from './geometry'
import { observeScroll } from './observe-scroll'
import { viewportOrigin } from './scroll-to'
import { EDGE_TOLERANCE, type ScrollTarget } from './types'

// A null top is a section without a layout box; it keeps its index but can never be active.
export function pickActiveSection(
  sectionTops: Array<number | null>,
  line: number,
  atEnd: boolean
): number {
  let active = -1
  sectionTops.forEach((top, index) => {
    if (top === null) return
    if (atEnd || top <= line + EDGE_TOLERANCE) active = index
  })
  return active
}

export function observeActiveSection(
  sections: HTMLElement[],
  listener: (index: number) => void,
  { root = window, offset = 0 }: { root?: ScrollTarget; offset?: number } = {}
): () => void {
  if (!Number.isFinite(offset)) {
    throw new RangeError(`observeActiveSection: offset must be a finite number, got ${offset}`)
  }
  if (!isWindow(root) && !sections.every((section) => root.contains(section))) {
    throw new Error('observeActiveSection: every section must be inside the root')
  }
  let atEnd = false
  let active: number | undefined

  function update() {
    const line = viewportOrigin(root).top + offset
    const tops = sections.map(layoutTop)
    const next = pickActiveSection(tops, line, atEnd)
    if (next === active) return
    active = next
    listener(next)
  }

  // Sections can move without the root's scroll metrics changing, e.g. one grows while another shrinks.
  const resizeObserver = new ResizeObserver(update)
  for (const section of sections) resizeObserver.observe(section)
  const stopObservingScroll = observeScroll(root, (state) => {
    atEnd = state.canScrollY && state.atBottom
    update()
  })

  return () => {
    stopObservingScroll()
    resizeObserver.disconnect()
  }
}

// display:none and detached elements report a zero rect, which would read as sitting at the top.
function layoutTop(element: HTMLElement): number | null {
  if (element.getClientRects().length === 0) return null
  return element.getBoundingClientRect().top
}
