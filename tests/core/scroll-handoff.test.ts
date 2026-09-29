import { describe, expect, onTestFinished, test } from 'vitest'
import { scrollHandoff, type ScrollHandoffOptions } from '../../src/core'
import {
  createBox,
  createScroller,
  inlineDeclarations,
  mount,
  mountPage,
  nextFrame,
} from '../helpers/dom'
import { emulateReducedMotion } from '../helpers/media'
import { pointIn, touchscreen, wheel, type Point } from '../helpers/pointer'

type Finger = ReturnType<typeof touchscreen>
type ScreenPoints = ReturnType<typeof screenPointsOver>

function attach(inner: HTMLElement, options?: ScrollHandoffOptions) {
  const cleanup = scrollHandoff(inner, options)
  onTestFinished(cleanup)
  return cleanup
}

// A 200px tall parent with 900px to scroll, whose top 100px are an inner list with 200px to scroll.
// It sits 500px down so a finger swiping 400px up from the list stays inside the test frame.
function mountNested() {
  const parent = mount(
    createBox(
      { width: 200, height: 200 },
      { overflow: 'auto', scrollbarWidth: 'none', marginTop: '500px' }
    )
  )
  const inner = createScroller({ width: 200, height: 100 }, { width: 200, height: 300 })
  parent.append(inner, createBox({ width: 200, height: 1000 }))
  return { parent, inner }
}

// The same list pinned to the top of a 3000px page, so the page is what it hands off to.
function mountInPage() {
  const inner = mount(
    createScroller(
      { width: 200, height: 100 },
      { width: 200, height: 300 },
      { position: 'fixed', top: '0', left: '0' }
    )
  )
  mountPage({ width: 200, height: 3000 })
  return inner
}

async function atInnerEnd(inner: HTMLElement) {
  inner.scrollTop = 200
  await nextFrame()
}

// A test-harness artifact, not library behaviour: after earlier touch tests a long synthesized
// swipe sometimes stalls partway (the native baseline too), and once the parent scrolls under the
// fixed pointer, later wheel events go to whatever is under it by then. Starting 100px from the end
// keeps the swipe short enough to reach the end before either happens.
async function nearInnerEnd(inner: HTMLElement) {
  inner.scrollTop = 100
  await nextFrame()
}

function wheelOn(target: HTMLElement, init: WheelEventInit): { prevented: boolean } {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init })
  return { prevented: !target.dispatchEvent(event) }
}

// Points over the element where it sits now: a finger stays put on screen as the content scrolls.
function screenPointsOver(element: HTMLElement) {
  const origin = pointIn(element, { x: 0, y: 0 })
  return (y: number, x = 100): Point => ({ x: origin.x + x, y: origin.y + y })
}

// Presses at the first height and moves through the rest, all within one touch.
async function swipeThrough(finger: Finger, over: ScreenPoints, ys: number[]) {
  const [first, ...rest] = ys
  await finger.down(over(first))
  await moveThrough(finger, over, rest)
}

async function moveThrough(finger: Finger, over: ScreenPoints, ys: number[]) {
  for (const y of ys) await finger.move(over(y))
}

function stepsFrom(from: number, to: number): number[] {
  const ys: number[] = []
  const direction = Math.sign(to - from)
  for (let y = from; y !== to + direction * 20; y += direction * 20) ys.push(y)
  return ys
}

// A native wheel scroll can land after the gesture resolves, a little short of the exact end.
async function innerSettledAtEnd(inner: HTMLElement) {
  await expect.poll(() => inner.scrollTop, { timeout: 5000 }).toBeGreaterThanOrEqual(199)
  await frames(3)
}

// Five 8px moves, 16ms apart, from a press at 90.
const quickFortyPixels = [90, 82, 74, 66, 58, 50]

async function restAndLift(finger: Finger) {
  finger.pause(300)
  await finger.up()
}

async function frames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

// Where the parent had got to when the next touch landed, seen before any handler ran.
function recordNextTouch(read: () => number) {
  const record = { position: -1 }
  const onTouchStart = () => (record.position = read())
  window.addEventListener('touchstart', onTouchStart, { capture: true, once: true })
  onTestFinished(() => window.removeEventListener('touchstart', onTouchStart, { capture: true }))
  return record
}

// The finger travel the browser held back before scrolling, seen at the first move it scrolled for.
function touchSlopKeptByBrowser(scroller: HTMLElement, pressedAt: number) {
  const slop = { px: NaN }
  const onTouchMove = (event: TouchEvent) => {
    if (event.cancelable || !Number.isNaN(slop.px)) return
    slop.px = pressedAt - event.touches[0].clientY - scroller.scrollTop
  }
  scroller.addEventListener('touchmove', onTouchMove)
  onTestFinished(() => scroller.removeEventListener('touchmove', onTouchMove))
  return slop
}

// Every wheel delta the browser delivered to the element during a gesture, added up.
function totalWheelDelta(element: HTMLElement) {
  const total = { y: 0 }
  const onWheel = (event: WheelEvent) => (total.y += event.deltaY)
  element.addEventListener('wheel', onWheel)
  onTestFinished(() => element.removeEventListener('wheel', onWheel))
  return total
}

const middleOf = (element: HTMLElement): Point => pointIn(element, { x: 100, y: 50 })

describe('native nested scrolling, without scrollHandoff', () => {
  test('a swipe that runs the inner list into its end never moves the parent', async () => {
    const { parent, inner } = mountNested()
    const finger = touchscreen()
    const over = screenPointsOver(inner)

    await swipeThrough(finger, over, stepsFrom(95, -305))
    await restAndLift(finger)

    expect(inner.scrollTop).toBe(200)
    expect(parent.scrollTop).toBe(0)
  })

  test('a trackpad swipe that runs the inner list into its end never moves the parent', async () => {
    const { parent, inner } = mountNested()
    await nearInnerEnd(inner)
    const delivered = totalWheelDelta(inner)

    await wheel().swipe(middleOf(inner), { dy: 300 })
    await innerSettledAtEnd(inner)

    expect(delivered.y).toBeGreaterThan(290)
    expect(parent.scrollTop).toBe(0)
  })

  test('a wheel step that crosses the inner end drops the part beyond it', async () => {
    const { parent, inner } = mountNested()
    inner.scrollTop = 180
    await nextFrame()

    await wheel().scroll(middleOf(inner), { dy: 40 })
    await frames(3)

    expect(inner.scrollTop).toBe(200)
    expect(parent.scrollTop).toBe(0)
  })
})

describe('scrollHandoff', () => {
  test('stops the inner element chaining on its axis and restores the style on cleanup', () => {
    const column = mountNested().inner
    const row = mountNested().inner
    column.style.overscrollBehaviorY = 'contain'
    const columnBefore = inlineDeclarations(column)
    const rowBefore = inlineDeclarations(row)

    const detachColumn = attach(column)
    const detachRow = attach(row, { axis: 'x' })

    expect(column.style.overscrollBehaviorY).toBe('none')
    expect(row.style.overscrollBehaviorX).toBe('none')
    expect(row.style.overscrollBehaviorY).toBe('')
    detachColumn()
    detachRow()
    expect(inlineDeclarations(column)).toEqual(columnBefore)
    expect(inlineDeclarations(row)).toEqual(rowBefore)
  })

  describe('wheel', () => {
    test('a step the inner list has room for is left to the browser', () => {
      const { parent, inner } = mountNested()
      attach(inner)

      const { prevented } = wheelOn(inner, { deltaY: 40 })

      expect(prevented).toBe(false)
      expect(parent.scrollTop).toBe(0)
    })

    test('a step at the inner end scrolls the parent by the whole step', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)

      const { prevented } = wheelOn(inner, { deltaY: 40 })

      expect(prevented).toBe(true)
      expect(inner.scrollTop).toBe(200)
      expect(parent.scrollTop).toBe(40)
    })

    test('a step past the inner end takes the list to its end and the parent the rest', async () => {
      const { parent, inner } = mountNested()
      inner.scrollTop = 170
      await nextFrame()
      attach(inner)

      wheelOn(inner, { deltaY: 50 })

      expect(inner.scrollTop).toBe(200)
      expect(parent.scrollTop).toBe(20)
    })

    test('a step back up from the parent is handed on at the inner start as well', async () => {
      const { parent, inner } = mountNested()
      parent.scrollTop = 300
      await nextFrame()
      attach(inner)

      wheelOn(inner, { deltaY: -40 })

      expect(parent.scrollTop).toBe(260)
    })

    test('counts line steps as 16px', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)

      wheelOn(inner, { deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE })

      expect(parent.scrollTop).toBe(48)
    })

    test('counts page steps as the height of the inner list', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)

      wheelOn(inner, { deltaY: 2, deltaMode: WheelEvent.DOM_DELTA_PAGE })

      expect(parent.scrollTop).toBe(200)
    })

    test('leaves a mostly sideways step to the browser', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)

      const { prevented } = wheelOn(inner, { deltaX: 40, deltaY: 10 })

      expect(prevented).toBe(false)
      expect(parent.scrollTop).toBe(0)
    })

    test('leaves pinch-zoom, which arrives as a ctrl wheel, to the browser', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)

      const { prevented } = wheelOn(inner, { deltaY: 40, ctrlKey: true })

      expect(prevented).toBe(false)
      expect(parent.scrollTop).toBe(0)
    })

    test('a real wheel step that crosses the inner end hands the rest to the parent', async () => {
      const { parent, inner } = mountNested()
      inner.scrollTop = 180
      await nextFrame()
      attach(inner)

      await wheel().scroll(middleOf(inner), { dy: 40 })
      await frames(3)

      expect(inner.scrollTop).toBe(200)
      expect(parent.scrollTop).toBe(20)
    })

    test('a trackpad swipe that runs the inner list into its end carries on in the parent', async () => {
      const { parent, inner } = mountNested()
      await nearInnerEnd(inner)
      attach(inner)
      const delivered = totalWheelDelta(inner)

      await wheel().swipe(middleOf(inner), { dy: 300 })
      await innerSettledAtEnd(inner)

      expect(delivered.y).toBeGreaterThan(290)
      expect(parent.scrollTop).toBeCloseTo(delivered.y - 100, -1)
    })

    test('with axis x, chains sideways steps and ignores vertical ones', async () => {
      const parent = mount(
        createBox(
          { width: 200, height: 100 },
          { display: 'flex', overflow: 'auto', scrollbarWidth: 'none' }
        )
      )
      const inner = createScroller(
        { width: 100, height: 100 },
        { width: 300, height: 100 },
        { flexShrink: '0' }
      )
      parent.append(inner, createBox({ width: 1000, height: 100 }, { flexShrink: '0' }))
      inner.scrollLeft = 200
      await nextFrame()
      attach(inner, { axis: 'x' })

      const vertical = wheelOn(inner, { deltaY: 40 })
      wheelOn(inner, { deltaX: 40 })

      expect(vertical.prevented).toBe(false)
      expect(parent.scrollLeft).toBe(40)
    })

    test('scrolls the page when the list has no scrolling ancestor', async () => {
      const inner = mountInPage()
      await atInnerEnd(inner)
      attach(inner)

      wheelOn(inner, { deltaY: 40 })

      expect(window.scrollY).toBe(40)
    })

    test('scrolls the parent it was given instead of the nearest one', async () => {
      const { parent, inner } = mountNested()
      mountPage({ width: 200, height: 3000 })
      await atInnerEnd(inner)
      attach(inner, { parent: window })

      wheelOn(inner, { deltaY: 40 })

      expect(parent.scrollTop).toBe(0)
      expect(window.scrollY).toBe(40)
    })

    test('stops handing off after cleanup', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      const detach = attach(inner)

      detach()
      const { prevented } = wheelOn(inner, { deltaY: 40 })

      expect(prevented).toBe(false)
      expect(parent.scrollTop).toBe(0)
    })
  })

  describe('touch', () => {
    test('a swipe that runs the inner list into its end carries on in the parent', async () => {
      const { parent, inner } = mountNested()
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)

      const slop = touchSlopKeptByBrowser(inner, over(95).y)

      await swipeThrough(finger, over, stepsFrom(95, -305))
      await restAndLift(finger)

      // 400px of finger travel, less the slop, of which the list takes its 200.
      expect(slop.px).toBeGreaterThanOrEqual(0)
      expect(slop.px).toBeLessThan(20)
      expect(inner.scrollTop).toBe(200)
      expect(parent.scrollTop).toBeCloseTo(400 - slop.px - 200, 0)
    })

    test('a swipe that starts at the inner end moves the parent with the finger', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)

      await swipeThrough(finger, over, stepsFrom(90, 10))

      expect(inner.scrollTop).toBe(200)
      expect(parent.scrollTop).toBe(80)
      await restAndLift(finger)
      await frames(3)
      expect(parent.scrollTop).toBe(80)
    })

    test('lifting the finger mid-swipe flings the parent on', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)

      // 40px over 96ms is 417px/s, which coasts 207.9px further, to 247.9. Chromium coarsens event
      // timestamps to 0.1ms, so the span reads 95.9–96.1ms: ±0.2px, never enough to round off 248.
      await swipeThrough(finger, over, quickFortyPixels)
      await finger.up()

      await expect.poll(() => parent.scrollTop, { timeout: 5000 }).toBe(248)
    })

    test('the release still coasts when the user prefers reduced motion', async () => {
      await emulateReducedMotion()
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)

      await swipeThrough(finger, over, quickFortyPixels)
      await finger.up()

      expect(parent.scrollTop).toBeLessThan(248)
      await expect.poll(() => parent.scrollTop, { timeout: 5000 }).toBe(248)
    })

    test('reversing winds the parent back to where it started, then scrolls the list', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)
      await swipeThrough(finger, over, stepsFrom(90, -10))
      expect(parent.scrollTop).toBe(100)

      await moveThrough(finger, over, stepsFrom(10, 50))
      expect(parent.scrollTop).toBe(40)
      expect(inner.scrollTop).toBe(200)

      await moveThrough(finger, over, stepsFrom(70, 150))
      await restAndLift(finger)
      expect(parent.scrollTop).toBe(0)
      expect(inner.scrollTop).toBeLessThan(200)
    })

    test('reversing while the browser scrolls the list moves the list back, not both', async () => {
      const { parent, inner } = mountNested()
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)
      await swipeThrough(finger, over, stepsFrom(95, -305))
      const handedOff = parent.scrollTop

      await moveThrough(finger, over, stepsFrom(-285, -245))
      await restAndLift(finger)

      expect(handedOff).toBeGreaterThan(0)
      expect(parent.scrollTop).toBe(handedOff)
      expect(inner.scrollTop).toBeLessThanOrEqual(140)
    })

    test('a sideways swipe at the inner end leaves the parent alone', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)

      await finger.down(over(60, 150))
      for (const [x, y] of [
        [130, 55],
        [100, 50],
        [70, 45],
      ]) {
        await finger.move(over(y, x))
      }
      await restAndLift(finger)

      expect(parent.scrollTop).toBe(0)
    })

    test('a touch on the list stops the parent fling where it is', async () => {
      const { parent, inner } = mountNested()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)
      await swipeThrough(finger, over, stepsFrom(90, 10))
      await finger.up()
      await nextFrame()
      const touch = recordNextTouch(() => parent.scrollTop)

      await finger.down(over(50))
      await frames(3)

      expect(touch.position).toBeGreaterThan(80)
      expect(touch.position).toBeLessThan(579)
      expect(parent.scrollTop).toBe(touch.position)
      await finger.up()
    })

    test('flings the page, and a touch on the list stops it', async () => {
      const inner = mountInPage()
      await atInnerEnd(inner)
      attach(inner)
      const finger = touchscreen()
      const over = screenPointsOver(inner)
      await swipeThrough(finger, over, stepsFrom(90, 10))
      expect(window.scrollY).toBe(80)
      await finger.up()
      await nextFrame()
      const touch = recordNextTouch(() => window.scrollY)

      await finger.down(over(50))
      await frames(3)

      expect(touch.position).toBeGreaterThan(80)
      expect(touch.position).toBeLessThan(579)
      expect(window.scrollY).toBe(touch.position)
      await finger.up()
    })
  })
})
