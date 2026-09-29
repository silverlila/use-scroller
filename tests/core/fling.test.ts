import { describe, expect, test } from 'vitest'
import { fling, projectMomentum } from '../../src/core/fling'
import { createScroller, mount } from '../helpers/dom'

describe('projectMomentum', () => {
  test('projects 499px for a 1000px/s release', () => {
    expect(projectMomentum(1000)).toBeCloseTo(499, 6)
  })

  test('projects backwards for a negative velocity', () => {
    expect(projectMomentum(-2000)).toBeCloseTo(-998, 6)
  })
})

describe('fling', () => {
  test('does nothing for a release slower than 50px/s', () => {
    const scroller = mount(
      createScroller({ width: 100, height: 100 }, { width: 100, height: 2000 })
    )

    expect(fling(scroller, 'y', 49)).toBeNull()
    expect(scroller.scrollTop).toBe(0)
  })

  test('does nothing for a NaN velocity', () => {
    const scroller = mount(
      createScroller({ width: 100, height: 100 }, { width: 100, height: 2000 })
    )

    expect(fling(scroller, 'y', NaN)).toBeNull()
    expect(scroller.scrollTop).toBe(0)
  })

  test('coasts to the projected distance', async () => {
    const scroller = mount(
      createScroller({ width: 100, height: 100 }, { width: 100, height: 2000 })
    )
    scroller.scrollTop = 100

    const handle = fling(scroller, 'y', 1000)

    expect(await handle?.finished).toBe('completed')
    expect(scroller.scrollTop).toBeCloseTo(599, 0)
  })

  test('stops at the edge when the projection overshoots it', async () => {
    const scroller = mount(createScroller({ width: 300, height: 100 }, { width: 500, height: 100 }))
    scroller.scrollLeft = 150

    const handle = fling(scroller, 'x', -3000)

    expect(await handle?.finished).toBe('completed')
    expect(scroller.scrollLeft).toBe(0)
  })
})
