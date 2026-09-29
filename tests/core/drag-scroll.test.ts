import { describe, expect, onTestFinished, test } from 'vitest'
import { animateScroll, dragScroll, type DragScrollOptions } from '../../src/core'
import {
  createBox,
  createScroller,
  inlineDeclarations,
  mount,
  mountPage,
  nextFrame,
} from '../helpers/dom'
import { emulateReducedMotion } from '../helpers/media'
import { mouse, pointIn, touchscreen } from '../helpers/pointer'

type Finger = ReturnType<typeof touchscreen> | ReturnType<typeof mouse>

function attach(element: HTMLElement, options?: DragScrollOptions) {
  const cleanup = dragScroll(element, options)
  onTestFinished(cleanup)
  return cleanup
}

function mountTrack(style: Partial<CSSStyleDeclaration> = {}) {
  return mount(createScroller({ width: 200, height: 100 }, { width: 1000, height: 100 }, style))
}

// Pages that snap at their start in a 200px track; 100px pages snap at 0, 100, … 800.
function mountSnapTrack(pageWidth = 100) {
  const track = mount(
    createBox(
      { width: 200, height: 100 },
      {
        display: 'flex',
        overflow: 'auto',
        scrollbarWidth: 'none',
        scrollSnapType: 'x mandatory',
      }
    )
  )
  for (let i = 0; i < 1000 / pageWidth; i++) {
    track.append(
      createBox({ width: pageWidth, height: 100 }, { flexShrink: '0', scrollSnapAlign: 'start' })
    )
  }
  return track
}

// Touches at x=150; the first move crosses the 8px slop and anchors the drag, so the track then
// follows each later move one to one.
async function dragAcross(finger: Finger, track: HTMLElement, xs: number[]) {
  await finger.down(pointIn(track, { x: 150, y: 50 }))
  for (const x of xs) await finger.move(pointIn(track, { x, y: 50 }))
}

// A finger that rests before lifting releases with no velocity.
async function restAndLift(finger: Finger) {
  finger.pause(300)
  await finger.up()
}

async function frames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

// Whether a release animation was running when the next touch landed, and where it had got to.
function recordNextPointerDown(track: HTMLElement) {
  const record = { releaseRunning: false, position: -1 }
  const onPointerDown = () => {
    record.releaseRunning = track.style.scrollSnapType === 'none'
    record.position = track.scrollLeft
  }
  window.addEventListener('pointerdown', onPointerDown, { capture: true, once: true })
  onTestFinished(() => window.removeEventListener('pointerdown', onPointerDown, { capture: true }))
  return record
}

async function settledSnapType(track: HTMLElement, original: string) {
  await expect.poll(() => track.style.scrollSnapType, { timeout: 5000 }).toBe(original)
}

describe('dragScroll', () => {
  test('hands panning across the other axis to the browser and restores touch-action', () => {
    const row = mountTrack({ touchAction: 'manipulation' })
    const column = mountTrack()
    const rowBefore = inlineDeclarations(row)
    const columnBefore = inlineDeclarations(column)

    const detachRow = attach(row)
    const detachColumn = attach(column, { axis: 'y' })

    expect(row.style.touchAction).toBe('pan-y pinch-zoom')
    expect(column.style.touchAction).toBe('pan-x pinch-zoom')
    detachRow()
    detachColumn()
    expect(inlineDeclarations(row)).toEqual(rowBefore)
    expect(inlineDeclarations(column)).toEqual(columnBefore)
  })

  test('a horizontal touch drag scrolls the track by the distance moved', async () => {
    const track = mountTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 100, 60])

    expect(track.scrollLeft).toBe(80)
    await restAndLift(finger)
    await frames(3)
    expect(track.scrollLeft).toBe(80)
  })

  test('a vertical touch drag on a vertical track scrolls it', async () => {
    const track = mount(createScroller({ width: 100, height: 200 }, { width: 100, height: 1000 }))
    attach(track, { axis: 'y' })
    const finger = touchscreen()

    await finger.down(pointIn(track, { x: 50, y: 150 }))
    await finger.move(pointIn(track, { x: 50, y: 140 }))
    await finger.move(pointIn(track, { x: 50, y: 90 }))

    expect(track.scrollTop).toBe(50)
    await restAndLift(finger)
  })

  test('a vertical swipe that drifts sideways scrolls the page and leaves the track alone', async () => {
    const track = mountTrack()
    mountPage({ width: 100, height: 3000 })
    attach(track)
    const finger = touchscreen()

    await finger.down(pointIn(track, { x: 150, y: 90 }))
    for (const [x, y] of [
      [146, 75],
      [140, 50],
      [134, 20],
    ]) {
      await finger.move(pointIn(track, { x, y }))
    }
    await restAndLift(finger)

    expect(track.scrollLeft).toBe(0)
    await expect.poll(() => window.scrollY).toBeGreaterThan(0)
  })

  test('ignores the mouse by default', async () => {
    const track = mountTrack()
    attach(track)
    const pointer = mouse()

    await dragAcross(pointer, track, [140, 60])
    await pointer.up()

    expect(track.scrollLeft).toBe(0)
  })

  test('drags with the mouse when enabled', async () => {
    const track = mountTrack()
    attach(track, { mouse: true })
    const pointer = mouse()

    await dragAcross(pointer, track, [140, 60])
    await restAndLift(pointer)

    expect(track.scrollLeft).toBe(80)
  })

  test('a mostly vertical mouse drag is let go and never scrolls the track', async () => {
    const track = mountTrack()
    attach(track, { mouse: true })
    const pointer = mouse()

    await pointer.down(pointIn(track, { x: 150, y: 40 }))
    await pointer.move(pointIn(track, { x: 146, y: 55 }))
    await pointer.move(pointIn(track, { x: 60, y: 60 }))
    await pointer.up()

    expect(track.scrollLeft).toBe(0)
  })

  test('turns text selection off only while a mouse drag is under way', async () => {
    const track = mountTrack({ userSelect: 'text' })
    attach(track, { mouse: true })
    const pointer = mouse()

    await dragAcross(pointer, track, [140, 100])
    const duringDrag = getComputedStyle(track).userSelect
    await restAndLift(pointer)

    expect(duringDrag).toBe('none')
    expect(track.style.userSelect).toBe('text')
  })

  test('swallows the click that ends a mouse drag across a link, but not a later tap', async () => {
    const track = mountTrack()
    const link = document.createElement('a')
    link.href = '#followed'
    Object.assign(link.style, { position: 'absolute', inset: '0' })
    track.style.position = 'relative'
    track.append(link)
    let clicks = 0
    const countClick = (event: MouseEvent) => {
      event.preventDefault()
      clicks++
    }
    document.addEventListener('click', countClick)
    onTestFinished(() => document.removeEventListener('click', countClick))
    attach(track, { mouse: true })
    const pointer = mouse()

    await dragAcross(pointer, track, [140, 60])
    await restAndLift(pointer)
    expect(track.scrollLeft).toBe(80)
    expect(clicks).toBe(0)

    await pointer.down(pointIn(track, { x: 50, y: 50 }))
    await pointer.up()
    expect(clicks).toBe(1)
  })

  test('a click long after a drag that ended without one still gets through', async () => {
    const track = mountTrack()
    const button = document.createElement('button')
    track.append(button)
    let clicks = 0
    button.addEventListener('click', () => clicks++)
    attach(track)
    const finger = touchscreen()
    let liftedAt = Infinity
    track.addEventListener('pointerup', (event) => (liftedAt = event.timeStamp), { once: true })

    await dragAcross(finger, track, [140, 100])
    await finger.up()
    await expect.poll(() => performance.now()).toBeGreaterThan(liftedAt + 200)
    button.click()

    expect(clicks).toBe(1)
  })

  test('a mouse let go outside the track before dragging does not drag on the way back', async () => {
    const track = mountTrack()
    attach(track, { mouse: true })
    const pointer = mouse()

    await pointer.down(pointIn(track, { x: 150, y: 50 }))
    await pointer.move(pointIn(track, { x: 150, y: 160 }))
    await pointer.up()
    await pointer.hover(pointIn(track, { x: 60, y: 50 }))
    await pointer.hover(pointIn(track, { x: 20, y: 50 }))

    expect(track.scrollLeft).toBe(0)
  })

  test('a velocity is measured from event timestamps, not from when handlers run', async () => {
    const track = mountTrack()
    attach(track)
    const slow = touchscreen()

    await slow.down(pointIn(track, { x: 150, y: 50 }))
    for (const x of [140, 120, 100]) {
      slow.pause(200)
      await slow.move(pointIn(track, { x, y: 50 }))
    }
    await slow.up()
    await frames(5)

    expect(track.scrollLeft).toBe(40)
  })

  test('a quick release flings on past the release point', async () => {
    const track = mountTrack()
    attach(track)
    const finger = touchscreen()

    // 40px over 96ms is 417px/s, which coasts 207.9px further, to 247.9. Chromium coarsens event
    // timestamps to 0.1ms, so the span reads 95.9–96.1ms: ±0.2px, never enough to round off 248.
    await dragAcross(finger, track, [140, 132, 124, 116, 108, 100])
    await finger.up()

    await expect.poll(() => track.scrollLeft, { timeout: 5000 }).toBe(248)
  })

  test('a release still animates when the user prefers reduced motion', async () => {
    await emulateReducedMotion()
    const track = mountSnapTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 120, 100])
    await finger.up()

    expect(track.scrollLeft).toBeLessThan(500)
    await settledSnapType(track, 'x mandatory')
    expect(track.scrollLeft).toBe(500)
  })

  test('a slow release on a snap track settles on the nearest snap position', async () => {
    const track = mountSnapTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 110, 80, 50, 10])
    expect(track.style.scrollSnapType).toBe('none')
    await restAndLift(finger)

    await settledSnapType(track, 'x mandatory')
    expect(track.scrollLeft).toBe(100)
  })

  test('a quick release on a snap track lands on the snap position its momentum reaches', async () => {
    const track = mountSnapTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 120, 100])
    await finger.up()

    await settledSnapType(track, 'x mandatory')
    expect(track.scrollLeft).toBe(500)
  })

  test('a cancelled drag stops without momentum and restores snapping', async () => {
    const track = mountSnapTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 120, 100])
    await finger.cancel()

    await settledSnapType(track, 'x mandatory')
    expect(track.scrollLeft).toBe(0)
  })

  test('a cancelled drag on a plain track stays where it was let go', async () => {
    const track = mountTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 120, 100])
    await finger.cancel()
    await frames(5)

    expect(track.scrollLeft).toBe(40)
  })

  test('a touch during the release stops it in place and drags on from there', async () => {
    const track = mountSnapTrack(1000 / 3)
    const original = track.style.scrollSnapType
    attach(track)
    const finger = touchscreen()
    await dragAcross(finger, track, [140, 120, 100])
    await finger.up()
    const touch = recordNextPointerDown(track)
    await nextFrame()

    await finger.down(pointIn(track, { x: 150, y: 50 }))
    await frames(3)

    expect(touch.releaseRunning).toBe(true)
    expect(track.scrollLeft).toBe(touch.position)
    await finger.move(pointIn(track, { x: 140, y: 50 }))
    await finger.move(pointIn(track, { x: 170, y: 50 }))
    expect(track.scrollLeft).toBe(touch.position - 30)
    await restAndLift(finger)
    await settledSnapType(track, original)
  })

  test('a tap during the release settles on a snap position and restores snapping', async () => {
    const track = mountSnapTrack(250)
    attach(track)
    const finger = touchscreen()
    await dragAcross(finger, track, [140, 120, 100])
    await finger.up()
    const touch = recordNextPointerDown(track)

    await finger.down(pointIn(track, { x: 150, y: 50 }))
    await finger.up()

    expect(touch.releaseRunning).toBe(true)
    await settledSnapType(track, 'x mandatory')
    expect([0, 250, 500, 750]).toContain(track.scrollLeft)
  })

  test('a wheel that interrupts the release restores snapping at once', async () => {
    const track = mountSnapTrack()
    attach(track)
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 120, 100])
    await finger.up()
    track.dispatchEvent(new WheelEvent('wheel', { deltaY: 10 }))

    expect(track.style.scrollSnapType).toBe('x mandatory')
  })

  test('a drag stops an animation that ignores user input and scrolls on from where it was', async () => {
    const track = mountTrack()
    attach(track)
    const handle = animateScroll(
      track,
      { x: 400 },
      {
        interruptible: false,
        animation: { type: 'tween', duration: 60_000, easing: () => 0.5 },
      }
    )
    onTestFinished(() => handle.cancel())
    await nextFrame()
    const finger = touchscreen()

    await dragAcross(finger, track, [140, 110])

    expect(track.scrollLeft).toBe(230)
    track.scrollLeft = 10
    await frames(3)
    expect(track.scrollLeft).toBe(10)
    await restAndLift(finger)
  })

  test('cleanup mid-drag restores snapping and touch-action', async () => {
    const track = mountSnapTrack()
    const before = inlineDeclarations(track)
    const detach = attach(track)
    const finger = touchscreen()
    await dragAcross(finger, track, [140, 120])

    detach()

    expect(inlineDeclarations(track)).toEqual(before)
    const stopped = track.scrollLeft
    await finger.move(pointIn(track, { x: 60, y: 50 }))
    expect(track.scrollLeft).toBe(stopped)
    await finger.up()
  })

  test('cleanup during the release stops it and restores snapping', async () => {
    const track = mountSnapTrack()
    const before = inlineDeclarations(track)
    const detach = attach(track)
    const finger = touchscreen()
    await dragAcross(finger, track, [140, 120, 100])
    await finger.up()

    detach()

    expect(inlineDeclarations(track)).toEqual(before)
    track.scrollLeft = 300
    await frames(3)
    expect(track.scrollLeft).toBe(300)
  })
})
