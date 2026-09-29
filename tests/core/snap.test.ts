import { describe, expect, test } from 'vitest'
import { pickSnapTarget, readSnapPositions } from '../../src/core/snap'
import { createBox, mount } from '../helpers/dom'

// Five 150px items in a 200px track: they start at 0, 150, 300, 450 and 600, and the range ends at 550.
function mountRow(
  itemStyle: Partial<CSSStyleDeclaration>,
  trackStyle: Partial<CSSStyleDeclaration> = {}
) {
  const track = mount(
    createBox(
      { width: 200, height: 100 },
      { display: 'flex', overflow: 'auto', scrollSnapType: 'x mandatory', ...trackStyle }
    )
  )
  for (let i = 0; i < 5; i++) {
    track.append(createBox({ width: 150, height: 100 }, { flexShrink: '0', ...itemStyle }))
  }
  return track
}

describe('readSnapPositions', () => {
  test('aligns item starts with the scrollport start', () => {
    const track = mountRow({ scrollSnapAlign: 'start' })

    expect(readSnapPositions(track, 'x')).toEqual([0, 150, 300, 450, 550])
  })

  test('aligns item centers with the scrollport center', () => {
    const track = mountRow({ scrollSnapAlign: 'center' })

    expect(readSnapPositions(track, 'x')).toEqual([0, 125, 275, 425, 550])
  })

  test('aligns item ends with the scrollport end', () => {
    const track = mountRow({ scrollSnapAlign: 'end' })

    expect(readSnapPositions(track, 'x')).toEqual([0, 100, 250, 400, 550])
  })

  test('insets the scrollport by scroll-padding', () => {
    const track = mountRow({ scrollSnapAlign: 'start' }, { scrollPaddingLeft: '20px' })

    expect(readSnapPositions(track, 'x')).toEqual([0, 130, 280, 430, 550])
  })

  test('resolves a percentage scroll-padding against the scrollport', () => {
    const track = mountRow({ scrollSnapAlign: 'start' }, { scrollPaddingLeft: '10%' })

    expect(readSnapPositions(track, 'x')).toEqual([0, 130, 280, 430, 550])
  })

  test('outsets each item by its scroll-margin', () => {
    const track = mountRow({ scrollSnapAlign: 'start', scrollMarginLeft: '10px' })

    expect(readSnapPositions(track, 'x')).toEqual([0, 140, 290, 440, 550])
  })

  test('measures from the content origin whatever the scroll position and border', () => {
    const track = mountRow({ scrollSnapAlign: 'start' }, { borderLeft: '7px solid' })
    track.scrollLeft = 160

    expect(readSnapPositions(track, 'x')).toEqual([0, 150, 300, 450, 550])
  })

  test('counts snap areas inside plain wrappers', () => {
    const track = mountRow({ scrollSnapAlign: 'none' })
    track.children[2].append(createBox({ width: 150, height: 100 }, { scrollSnapAlign: 'start' }))

    expect(readSnapPositions(track, 'x')).toEqual([300])
  })

  test('leaves out snap areas that belong to a nested snap container', () => {
    const track = mountRow({ scrollSnapAlign: 'start' })
    const nested = createBox(
      { width: 150, height: 100 },
      { flexShrink: '0', display: 'flex', overflow: 'auto', scrollSnapType: 'x mandatory' }
    )
    for (let i = 0; i < 3; i++) {
      nested.append(
        createBox({ width: 100, height: 100 }, { flexShrink: '0', scrollSnapAlign: 'start' })
      )
    }
    track.children[1].replaceWith(nested)

    expect(readSnapPositions(track, 'x')).toEqual([0, 300, 450, 550])
  })

  // Sweeping the range makes the browser land on every snap position it knows of.
  function nativeSnapPositions(track: HTMLElement): number[] {
    const landed = new Set<number>()
    for (let position = 0; position >= -track.scrollWidth; position -= 10) {
      track.scrollLeft = position
      landed.add(track.scrollLeft)
    }
    for (let position = 0; position <= track.scrollWidth; position += 10) {
      track.scrollLeft = position
      landed.add(track.scrollLeft)
    }
    return [...landed].sort((a, b) => a - b)
  }

  test.each(['start', 'center', 'end'])(
    'matches where the browser snaps a right-to-left track aligned to %s',
    (align) => {
      const track = mountRow({ scrollSnapAlign: align }, { direction: 'rtl' })

      expect(readSnapPositions(track, 'x')).toEqual(nativeSnapPositions(track))
    }
  )

  test('matches where the browser snaps a left-to-right track', () => {
    const track = mountRow({ scrollSnapAlign: 'start' }, { scrollPaddingLeft: '20px' })

    expect(readSnapPositions(track, 'x')).toEqual(nativeSnapPositions(track))
  })

  test('returns nothing when the container does not snap', () => {
    const track = mountRow({ scrollSnapAlign: 'start' }, { scrollSnapType: 'none' })

    expect(readSnapPositions(track, 'x')).toEqual([])
  })

  test('reads the block-axis alignment for y and the inline-axis one for x', () => {
    const list = mount(
      createBox({ width: 100, height: 100 }, { overflow: 'auto', scrollSnapType: 'y mandatory' })
    )
    for (let i = 0; i < 3; i++) {
      list.append(createBox({ width: 100, height: 60 }, { scrollSnapAlign: 'start none' }))
    }

    expect(readSnapPositions(list, 'y')).toEqual([0, 60, 80])
    expect(readSnapPositions(list, 'x')).toEqual([])
  })
})

describe('pickSnapTarget', () => {
  const pages = [0, 300, 600, 900]

  test('a slow release settles on the position nearest the projection', () => {
    expect(pickSnapTarget(pages, 380, 420, 120)).toBe(300)
  })

  test('a fast flick keeps the nearest position when it already lies ahead', () => {
    expect(pickSnapTarget(pages, 100, 700, 2000)).toBe(600)
  })

  test('a fast flick forward moves on to the next position ahead', () => {
    expect(pickSnapTarget(pages, 120, 140, 500)).toBe(300)
  })

  test('a fast flick backward moves on to the next position behind', () => {
    expect(pickSnapTarget(pages, 480, 460, -500)).toBe(300)
  })

  test('a fast flick with nothing ahead settles on the nearest position', () => {
    expect(pickSnapTarget(pages, 900, 910, 500)).toBe(900)
  })

  test('a position less than a pixel ahead does not count as moving on', () => {
    expect(pickSnapTarget(pages, 299.5, 310, 500)).toBe(600)
  })

  test('rejects an empty list of positions', () => {
    expect(() => pickSnapTarget([], 0, 0, 0)).toThrow(RangeError)
  })
})
