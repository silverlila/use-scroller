import { StrictMode, useRef } from 'react'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { useDragScroll, type DragScrollOptions } from '../../src/react'
import { pointIn, touchscreen } from '../helpers/pointer'

function Track(options: DragScrollOptions) {
  const ref = useRef<HTMLDivElement>(null)
  useDragScroll(ref, options)
  return (
    <div
      ref={ref}
      aria-label="track"
      style={{ width: 200, height: 200, overflow: 'auto', scrollbarWidth: 'none' }}
    >
      <div style={{ width: 1000, height: 1000 }} />
    </div>
  )
}

function trackElement(): HTMLElement {
  const track = document.querySelector<HTMLElement>('[aria-label="track"]')
  if (!track) throw new Error('track is not rendered')
  return track
}

describe('useDragScroll', () => {
  test('drags the element behind the ref with a finger', async () => {
    await render(<Track />, { wrapper: StrictMode })
    const track = trackElement()
    const finger = touchscreen()

    await finger.down(pointIn(track, { x: 150, y: 100 }))
    await finger.move(pointIn(track, { x: 140, y: 100 }))
    await finger.move(pointIn(track, { x: 90, y: 100 }))
    finger.pause(300)
    await finger.up()

    expect(track.scrollLeft).toBe(50)
    expect(track.style.touchAction).toBe('pan-y pinch-zoom')
  })

  test('follows a change of axis', async () => {
    const screen = await render(<Track />)

    await screen.rerender(<Track axis="y" />)

    expect(trackElement().style.touchAction).toBe('pan-x pinch-zoom')
  })

  test('lets go of the element on unmount', async () => {
    const screen = await render(<Track />, { wrapper: StrictMode })
    const track = trackElement()

    await screen.unmount()

    expect(track.style.touchAction).toBe('')
  })
})
