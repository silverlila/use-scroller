import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { observeScroll, type ScrollState, type ScrollTarget } from '../../src/core'
import { createBox, createScroller, mount, mountPage, nextFrame } from '../helpers/dom'

function recordStates(target: ScrollTarget, options?: { idleDelay?: number }) {
  const states: ScrollState[] = []
  const unsubscribe = observeScroll(target, (state) => states.push(state), options)
  onTestFinished(unsubscribe)
  return { states, unsubscribe, latest: () => states[states.length - 1] }
}

async function waitFrames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

function mountScroller(style: Partial<CSSStyleDeclaration> = {}) {
  return mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }, style))
}

describe('observeScroll', () => {
  test('emits the current state synchronously on subscribe', () => {
    const scroller = mountScroller()
    scroller.scrollLeft = 100
    scroller.scrollTop = 150

    const { states } = recordStates(scroller)

    expect(states).toEqual([
      {
        x: 100,
        y: 150,
        minX: 0,
        maxX: 400,
        maxY: 300,
        progressX: 0.25,
        progressY: 0.5,
        atTop: false,
        atBottom: false,
        atLeft: false,
        atRight: false,
        canScrollX: true,
        canScrollY: true,
        directionX: 0,
        directionY: 0,
        velocityX: 0,
        velocityY: 0,
        isScrolling: false,
      },
    ])
  })

  test('reports an axis without overflow as not scrollable and at both edges', () => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 200, height: 101 }))

    const { latest } = recordStates(scroller)

    expect(latest()).toMatchObject({
      progressY: 0,
      canScrollY: false,
      atTop: true,
      atBottom: true,
      progressX: 0,
      canScrollX: false,
      atLeft: true,
      atRight: true,
    })
  })

  test('counts a position within a pixel of an edge as at that edge', () => {
    const scroller = mountScroller()
    scroller.scrollLeft = 399
    scroller.scrollTop = 299

    expect(recordStates(scroller).latest()).toMatchObject({
      atBottom: true,
      atTop: false,
      atRight: true,
      atLeft: false,
    })

    scroller.scrollLeft = 1
    scroller.scrollTop = 1

    expect(recordStates(scroller).latest()).toMatchObject({
      atTop: true,
      atBottom: false,
      atLeft: true,
      atRight: false,
    })
  })

  test('uses the negative horizontal range of an RTL element for its edges and progress', async () => {
    const scroller = mountScroller({ direction: 'rtl' })
    const { latest } = recordStates(scroller)

    expect(latest()).toMatchObject({ x: 0, atRight: true, atLeft: false, progressX: 1 })

    scroller.scrollLeft = -400

    await vi.waitFor(() =>
      expect(latest()).toMatchObject({ x: -400, atLeft: true, atRight: false, progressX: 0 })
    )
  })

  test('reports direction and velocity while scrolling', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller, { idleDelay: 60_000 })

    scroller.scrollTop = 120
    await vi.waitFor(() => expect(latest()).toMatchObject({ y: 120, isScrolling: true }))
    expect(latest()).toMatchObject({ directionY: 1, directionX: 0 })
    expect(latest().velocityY).toBeGreaterThan(0)

    scroller.scrollTop = 40
    await vi.waitFor(() => expect(latest()).toMatchObject({ y: 40, isScrolling: true }))
    expect(latest().directionY).toBe(-1)
    expect(latest().velocityY).toBeLessThan(0)
  })

  test('settles to idle with zero velocity and keeps the last direction', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller, { idleDelay: 20 })

    scroller.scrollTop = 120

    await vi.waitFor(() =>
      expect(latest()).toMatchObject({
        y: 120,
        isScrolling: false,
        directionY: 1,
        velocityX: 0,
        velocityY: 0,
      })
    )
  })

  test('stays scrolling until the idle delay has passed without scroll events', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller, { idleDelay: 60_000 })

    scroller.scrollTop = 50
    await vi.waitFor(() => expect(latest()).toMatchObject({ y: 50, isScrolling: true }))
    await waitFrames(5)

    expect(latest().isScrolling).toBe(true)
  })

  test('keeps the scroll velocity when the container resizes mid-scroll', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller, { idleDelay: 60_000 })
    scroller.scrollTop = 50
    await vi.waitFor(() => expect(latest()).toMatchObject({ y: 50, isScrolling: true }))
    const { velocityY } = latest()

    scroller.style.width = '250px'

    await vi.waitFor(() => expect(latest().maxX).toBe(350))
    expect(latest()).toMatchObject({ y: 50, isScrolling: true, velocityY })
    expect(velocityY).toBeGreaterThan(0)
  })

  test.each([-1, NaN, Infinity, 2_147_483_648])('rejects an idle delay of %s', (idleDelay) => {
    const scroller = mountScroller()

    expect(() => observeScroll(scroller, vi.fn(), { idleDelay })).toThrow(RangeError)
  })

  test('accepts the longest idle delay a timer can hold', () => {
    const scroller = mountScroller()

    expect(() => recordStates(scroller, { idleDelay: 2_147_483_647 })).not.toThrow()
  })

  test('re-emits when a child is added, resized or removed', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller)
    const extra = createBox({ width: 600, height: 200 })

    scroller.append(extra)
    await vi.waitFor(() => expect(latest().maxY).toBe(500))

    extra.style.height = '300px'
    await vi.waitFor(() => expect(latest().maxY).toBe(600))

    extra.remove()
    await vi.waitFor(() => expect(latest().maxY).toBe(300))
  })

  test('re-emits when the content it started with is resized', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller)
    const content = scroller.firstElementChild
    if (!(content instanceof HTMLElement)) throw new Error('scroller has no content element')

    content.style.width = '900px'

    await vi.waitFor(() => expect(latest().maxX).toBe(700))
  })

  test('re-emits when the container itself is resized', async () => {
    const scroller = mountScroller()
    const { latest } = recordStates(scroller)

    scroller.style.height = '250px'

    await vi.waitFor(() => expect(latest()).toMatchObject({ maxY: 150, progressY: 0 }))
  })

  test('does not emit when a size change leaves the scroll state unchanged', async () => {
    const scroller = mountScroller()
    const { states } = recordStates(scroller)
    await waitFrames(3)
    const emitted = states.length

    scroller.append(createBox({ width: 10, height: 0 }))
    await waitFrames(5)

    expect(states).toHaveLength(emitted)
  })

  test('stops emitting and drops pending updates once unsubscribed', async () => {
    const scroller = mountScroller()
    const { states, unsubscribe } = recordStates(scroller, { idleDelay: 0 })

    scroller.scrollTop = 100
    scroller.dispatchEvent(new Event('scroll'))
    unsubscribe()
    scroller.style.height = '250px'
    scroller.append(createBox({ width: 600, height: 200 }))
    await waitFrames(5)

    expect(states).toHaveLength(1)
  })

  describe('on the window', () => {
    test('tracks the page position and range', async () => {
      await page.viewport(500, 400)
      mountPage({ width: 100, height: 3000 })
      const { latest } = recordStates(window, { idleDelay: 60_000 })

      expect(latest()).toMatchObject({ y: 0, maxY: 2600, atTop: true, canScrollX: false })

      window.scrollTo({ top: 1300, behavior: 'instant' })

      await vi.waitFor(() =>
        expect(latest()).toMatchObject({
          y: 1300,
          progressY: 0.5,
          directionY: 1,
          isScrolling: true,
        })
      )
    })

    test('re-emits when the page grows or the viewport resizes', async () => {
      await page.viewport(500, 400)
      mountPage({ width: 100, height: 3000 })
      const { latest } = recordStates(window)

      mount(createBox({ width: 100, height: 1000 }))
      await vi.waitFor(() => expect(latest().maxY).toBe(3600))

      await page.viewport(500, 600)
      await vi.waitFor(() => expect(latest().maxY).toBe(3400))
    })
  })
})
