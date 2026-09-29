import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { findScrollParent, isScrollable, readScroll } from '../../src/core'
import { writeScroll } from '../../src/core/geometry'
import { createBox, createScroller, mount, mountPage } from '../helpers/dom'

describe('readScroll', () => {
  test('reports position, range and viewport of a scrolled element', () => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))
    scroller.scrollLeft = 150
    scroller.scrollTop = 50

    expect(readScroll(scroller)).toEqual({
      x: 150,
      y: 50,
      minX: 0,
      maxX: 400,
      maxY: 300,
      viewportWidth: 200,
      viewportHeight: 100,
    })
  })

  test('reports a negative horizontal range for an RTL element', () => {
    const scroller = mount(
      createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }, { direction: 'rtl' })
    )
    scroller.scrollLeft = -150

    expect(readScroll(scroller)).toMatchObject({ x: -150, minX: -400, maxX: 0 })
  })

  test('reports the window position, range and viewport', async () => {
    await page.viewport(500, 400)
    mountPage({ width: 100, height: 3000 })
    window.scrollTo({ top: 1000, behavior: 'instant' })

    expect(readScroll(window)).toEqual({
      x: 0,
      y: 1000,
      minX: 0,
      maxX: 0,
      maxY: 2600,
      viewportWidth: 500,
      viewportHeight: 400,
    })
  })
})

describe('writeScroll', () => {
  test('applies the position synchronously even with scroll-behavior: smooth', () => {
    const scroller = mount(
      createScroller(
        { width: 200, height: 100 },
        { width: 600, height: 400 },
        { scrollBehavior: 'smooth' }
      )
    )

    writeScroll(scroller, { x: 120, y: 200 })

    expect(scroller.scrollLeft).toBe(120)
    expect(scroller.scrollTop).toBe(200)
  })

  test('leaves an axis that is not given where it was', () => {
    const scroller = mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }))
    scroller.scrollTop = 80

    writeScroll(scroller, { x: 30 })

    expect(scroller.scrollLeft).toBe(30)
    expect(scroller.scrollTop).toBe(80)
  })
})

describe('isScrollable', () => {
  test('is false when content overflows by no more than the edge tolerance', () => {
    const scroller = mount(createScroller({ width: 100, height: 100 }, { width: 100, height: 101 }))

    expect(isScrollable(scroller, 'y')).toBe(false)
  })

  test('is true when content overflows past the edge tolerance', () => {
    const scroller = mount(createScroller({ width: 100, height: 100 }, { width: 100, height: 102 }))

    expect(isScrollable(scroller, 'y')).toBe(true)
  })

  test('is false for overflowing content that is clipped with overflow: hidden', () => {
    const scroller = mount(
      createScroller(
        { width: 100, height: 100 },
        { width: 100, height: 500 },
        { overflow: 'hidden' }
      )
    )

    expect(isScrollable(scroller, 'y')).toBe(false)
  })
})

describe('findScrollParent', () => {
  test('skips ancestors that cannot scroll on the axis', () => {
    const target = createBox({ width: 10, height: 10 })
    const roomyAutoOverflow = createBox({ width: 100, height: 1000 }, { overflow: 'auto' })
    const horizontalOnly = createBox(
      { width: 100, height: 1000 },
      { overflowX: 'auto', overflowY: 'hidden' }
    )
    const wide = createBox({ width: 500, height: 1000 })
    const vertical = createBox({ width: 100, height: 200 }, { overflow: 'auto' })
    roomyAutoOverflow.append(target)
    wide.append(roomyAutoOverflow)
    horizontalOnly.append(wide)
    vertical.append(horizontalOnly)
    mount(vertical)

    expect(findScrollParent(target, 'y')).toBe(vertical)
    expect(findScrollParent(target, 'x')).toBe(horizontalOnly)
  })

  test('falls back to the window when no ancestor can scroll', () => {
    const target = createBox({ width: 10, height: 10 })
    mount(createBox({ width: 100, height: 100 }, { overflow: 'auto' })).append(target)

    expect(findScrollParent(target, 'y')).toBe(window)
  })
})
