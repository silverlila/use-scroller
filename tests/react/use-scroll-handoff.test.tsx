import { StrictMode, useRef } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { useScrollHandoff, type ScrollHandoffOptions } from '../../src/react'

function Nested(options: ScrollHandoffOptions) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollHandoff(ref, options)
  return (
    <div
      aria-label="parent"
      style={{ width: 200, height: 200, overflow: 'auto', scrollbarWidth: 'none' }}
    >
      <div
        ref={ref}
        aria-label="list"
        style={{ width: 200, height: 100, overflow: 'auto', scrollbarWidth: 'none' }}
      >
        <div style={{ width: 200, height: 300 }} />
      </div>
      <div style={{ width: 200, height: 1000 }} />
    </div>
  )
}

function byLabel(label: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[aria-label="${label}"]`)
  if (!element) throw new Error(`${label} is not rendered`)
  return element
}

describe('useScrollHandoff', () => {
  test('hands wheel scrolling past the end of the list on to its parent', async () => {
    await render(<Nested />, { wrapper: StrictMode })
    const list = byLabel('list')
    list.scrollTop = 200

    list.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true }))

    expect(byLabel('parent').scrollTop).toBe(40)
    expect(list.style.overscrollBehaviorY).toBe('none')
  })

  test('follows a change of axis', async () => {
    const screen = await render(<Nested />)

    await screen.rerender(<Nested axis="x" />)

    expect(byLabel('list').style.overscrollBehaviorY).toBe('')
    expect(byLabel('list').style.overscrollBehaviorX).toBe('none')
  })

  test('lets go of the list on unmount', async () => {
    const screen = await render(<Nested />, { wrapper: StrictMode })
    const list = byLabel('list')

    await screen.unmount()

    expect(list.style.overscrollBehaviorY).toBe('')
  })
})
