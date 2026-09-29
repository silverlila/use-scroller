import { describe, expect, test } from 'vitest'
import { scrollBy, scrollToEdge, scrollToElement, type ScrollAnimation } from '../../src/core'
import { createBox, createScroller, mount, mountPage } from '../helpers/dom'

const instant: ScrollAnimation = { type: 'instant' }
const quick: ScrollAnimation = { type: 'tween', duration: 60 }

describe('scrollToEdge', () => {
  test.each([
    ['bottom', { left: 0, top: 300 }],
    ['right', { left: 400, top: 0 }],
  ] as const)('scrolls to the %s edge', async (edge, expected) => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))

    await scrollToEdge(scroller, edge, { animation: quick }).finished

    expect({ left: scroller.scrollLeft, top: scroller.scrollTop }).toEqual(expected)
  })

  test.each([
    ['top', { left: 250, top: 0 }],
    ['left', { left: 0, top: 150 }],
  ] as const)('scrolls back to the %s edge', async (edge, expected) => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))
    scroller.scrollLeft = 250
    scroller.scrollTop = 150

    await scrollToEdge(scroller, edge, { animation: quick }).finished

    expect({ left: scroller.scrollLeft, top: scroller.scrollTop }).toEqual(expected)
  })

  test.each([
    ['left', -400],
    ['right', 0],
  ] as const)('reaches the %s edge of an RTL scroller', async (edge, expected) => {
    const scroller = mount(
      createScroller({ width: 200, height: 100 }, { width: 600, height: 100 }, { direction: 'rtl' })
    )
    scroller.scrollLeft = -150

    await scrollToEdge(scroller, edge, { animation: quick }).finished

    expect(scroller.scrollLeft).toBe(expected)
  })
})

describe('scrollToElement', () => {
  function mountList() {
    const scroller = mount(createBox({ width: 200, height: 100 }, { overflow: 'auto' }))
    const item = createBox({ width: 200, height: 50 })
    scroller.append(
      createBox({ width: 200, height: 300 }),
      item,
      createBox({ width: 200, height: 600 })
    )
    return { scroller, item }
  }

  test.each([
    ['start', 0, 300],
    ['center', 0, 275],
    ['end', 0, 250],
    ['start', 20, 280],
    ['center', 20, 265],
    ['end', 20, 250],
  ] as const)('aligns to %s with a %ipx offset', (align, offset, expectedTop) => {
    const { scroller, item } = mountList()

    scrollToElement(scroller, item, { align, offset, animation: instant })

    expect(scroller.scrollTop).toBe(expectedTop)
  })

  test('measures from inside the scroller border', () => {
    const { scroller, item } = mountList()
    scroller.style.border = '7px solid'
    scroller.scrollTop = 40

    scrollToElement(scroller, item, { animation: instant })

    expect(scroller.scrollTop).toBe(300)
  })

  test.each([
    ['fully visible', 280, 280],
    ['below the viewport', 0, 250],
    ['above the viewport', 330, 300],
  ])('nearest alignment with the element %s', (_, startTop, expectedTop) => {
    const { scroller, item } = mountList()
    scroller.scrollTop = startTop

    scrollToElement(scroller, item, { align: 'nearest', animation: instant })

    expect(scroller.scrollTop).toBe(expectedTop)
  })

  test('nearest alignment counts the offset area as hidden', () => {
    const { scroller, item } = mountList()
    scroller.scrollTop = 290

    scrollToElement(scroller, item, { align: 'nearest', offset: 20, animation: instant })

    expect(scroller.scrollTop).toBe(280)
  })

  test('aligns on the horizontal axis', () => {
    const scroller = mount(
      createBox({ width: 200, height: 100 }, { overflow: 'auto', display: 'flex' })
    )
    const item = createBox({ width: 50, height: 100 }, { flexShrink: '0' })
    scroller.append(
      createBox({ width: 300, height: 100 }, { flexShrink: '0' }),
      item,
      createBox({ width: 600, height: 100 }, { flexShrink: '0' })
    )

    scrollToElement(scroller, item, { align: 'center', animation: instant })

    expect(scroller.scrollLeft).toBe(225)
  })

  test('scrolls the window to an element, below a fixed header offset', async () => {
    mountPage({ width: 100, height: 0 })
    const item = createBox({ width: 100, height: 50 })
    mount(createBox({ width: 100, height: 1000 }))
    mount(item)
    mount(createBox({ width: 100, height: 3000 }))

    await scrollToElement(window, item, { offset: 60, animation: quick }).finished

    expect(window.scrollY).toBe(940)
  })

  test('throws for an element outside the scroller', () => {
    const { scroller } = mountList()
    const outsider = mount(createBox({ width: 10, height: 10 }))

    expect(() => scrollToElement(scroller, outsider)).toThrow(
      'scrollToElement: element is not inside the scroll target'
    )
  })
})

describe('scrollBy', () => {
  test('moves relative to the current position', async () => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))
    scroller.scrollTop = 50

    await scrollBy(scroller, { y: 30 }, { animation: quick }).finished

    expect(scroller.scrollTop).toBe(80)
    expect(scroller.scrollLeft).toBe(0)
  })

  test('repeated calls accumulate onto the in-flight destination', async () => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))

    const first = scrollBy(scroller, { y: 100 })
    const second = scrollBy(scroller, { y: 100 })

    expect(await first.finished).toBe('cancelled')
    expect(await second.finished).toBe('completed')
    expect(scroller.scrollTop).toBe(200)
  })

  test('accumulates from the clamped destination, not past the edge', async () => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))

    scrollBy(scroller, { y: 1000 })
    await scrollBy(scroller, { y: -100 }, { animation: quick }).finished

    expect(scroller.scrollTop).toBe(200)
  })
})
