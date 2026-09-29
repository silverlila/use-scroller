import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { observeActiveSection, scrollToElement, type ScrollTarget } from '../../src/core'
import { pickActiveSection } from '../../src/core/active-section'
import { createBox, mount, mountPage, nextFrame } from '../helpers/dom'

describe('pickActiveSection', () => {
  test.each([
    ['before the first section', [100, 500, 900], 0, false, -1],
    ['exactly on a section top', [0, 400, 800], 400, false, 1],
    ['within a pixel of the next top', [0, 401, 800], 400, false, 1],
    ['two pixels short of the next top', [0, 402, 800], 400, false, 0],
    ['inside sections taller than the viewport', [-1500, -500, 500], 0, false, 1],
    ['past every top', [-900, -600, -300], 0, false, 2],
    ['at the end with the last top below the line', [-900, -100, 300], 0, true, 2],
    ['with no sections', [], 0, false, -1],
    ['at the end with no sections', [], 0, true, -1],
    ['skipping a section without a layout box', [-300, null, 900], 0, false, 0],
    ['at the end with the last section hidden', [-900, -100, null], 0, true, 1],
    ['with every section hidden', [null, null], 0, true, -1],
  ])('picks the right section %s', (_, tops, line, atEnd, expected) => {
    expect(pickActiveSection(tops, line, atEnd)).toBe(expected)
  })
})

function recordActive(sections: HTMLElement[], options?: { root?: ScrollTarget; offset?: number }) {
  const indices: number[] = []
  const unsubscribe = observeActiveSection(sections, (index) => indices.push(index), options)
  onTestFinished(unsubscribe)
  return { indices, unsubscribe, latest: () => indices[indices.length - 1] }
}

function mountSections(
  heights: number[],
  { rootHeight = 200, before = 0 }: { rootHeight?: number; before?: number } = {}
) {
  // Scroll anchoring would shift scrollTop when a section resizes, hiding the case under test.
  const root = mount(
    createBox(
      { width: 200, height: rootHeight },
      { overflow: 'auto', scrollbarWidth: 'none', overflowAnchor: 'none' }
    )
  )
  const sections = heights.map((height) => createBox({ width: 200, height }))
  root.append(createBox({ width: 200, height: before }), ...sections)
  return { root, sections }
}

async function waitFrames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

// A scroll event still pending at subscribe time makes observeScroll re-emit later on its own.
async function scrollSettled(root: HTMLElement, top: number) {
  const scrolled = new Promise((resolve) =>
    root.addEventListener('scroll', resolve, { once: true })
  )
  root.scrollTop = top
  await scrolled
  await nextFrame()
}

describe('observeActiveSection', () => {
  test('emits the section under the reading line once on subscribe', () => {
    const { root, sections } = mountSections([300, 300, 100])
    root.scrollTop = 350

    const { indices } = recordActive(sections, { root })

    expect(indices).toEqual([1])
  })

  test('reports -1 until the first section reaches the line', async () => {
    const { root, sections } = mountSections([300, 300, 100], { before: 100 })
    const { indices, latest } = recordActive(sections, { root })
    expect(indices).toEqual([-1])

    root.scrollTop = 100

    await vi.waitFor(() => expect(latest()).toBe(0))
  })

  test('activates the next section when its top reaches the offset line, and only then', async () => {
    const { root, sections } = mountSections([300, 300, 100])
    const { indices } = recordActive(sections, { root, offset: 40 })

    root.scrollTop = 150
    await waitFrames(3)
    root.scrollTop = 250
    await waitFrames(3)
    expect(indices).toEqual([0])

    root.scrollTop = 260
    await vi.waitFor(() => expect(indices).toEqual([0, 1]))
  })

  test('activates the last section at the bottom even though its top never reaches the line', async () => {
    const { root, sections } = mountSections([300, 300, 100])
    const { latest } = recordActive(sections, { root })

    root.scrollTop = 499
    await vi.waitFor(() => expect(latest()).toBe(2))

    root.scrollTop = 450
    await vi.waitFor(() => expect(latest()).toBe(1))
  })

  test('follows a section that moves while the root scroll metrics stay the same', async () => {
    const { root, sections } = mountSections([300, 300, 100])
    const filler = createBox({ width: 200, height: 300 })
    root.append(filler)
    await scrollSettled(root, 250)
    const { latest } = recordActive(sections, { root })
    expect(latest()).toBe(0)

    sections[0].style.height = '200px'
    filler.style.height = '400px'

    await vi.waitFor(() => expect(latest()).toBe(1))
    expect(root.scrollTop).toBe(250)
  })

  test('recomputes when the root is resized', async () => {
    const { root, sections } = mountSections([300, 300, 100])
    root.scrollTop = 400
    const { latest } = recordActive(sections, { root })
    expect(latest()).toBe(1)

    root.style.height = '300px'

    await vi.waitFor(() => expect(latest()).toBe(2))
  })

  test('never activates a hidden section, and recomputes when it is shown or hidden', async () => {
    const { root, sections } = mountSections([300, 300, 300, 300])
    const [, middle] = sections
    middle.style.display = 'none'
    root.scrollTop = 350
    const { latest } = recordActive(sections, { root })
    expect(latest()).toBe(2)

    middle.style.display = ''
    await vi.waitFor(() => expect(latest()).toBe(1))

    middle.style.display = 'none'
    await vi.waitFor(() => expect(latest()).toBe(2))
  })

  test('skips a hidden section that would otherwise sit on the reading line', () => {
    const { root, sections } = mountSections([300, 300, 300, 300])
    sections[1].style.display = 'none'
    root.scrollTop = 100

    expect(recordActive(sections, { root }).indices).toEqual([0])
  })

  test('uses the reading line in a root that cannot scroll', () => {
    const { root, sections } = mountSections([100, 100, 100], { rootHeight: 300 })

    expect(recordActive(sections, { root }).indices).toEqual([0])
  })

  test('stops emitting once unsubscribed', async () => {
    const { root, sections } = mountSections([300, 300, 100])
    const { indices, unsubscribe } = recordActive(sections, { root })

    unsubscribe()
    root.scrollTop = 350
    sections[0].style.height = '50px'
    await waitFrames(5)

    expect(indices).toEqual([0])
  })

  test.each([NaN, Infinity])('rejects an offset of %s', (offset) => {
    const { root, sections } = mountSections([300])

    expect(() => observeActiveSection(sections, vi.fn(), { root, offset })).toThrow(RangeError)
  })

  test('throws for a section outside the root', () => {
    const { root, sections } = mountSections([300])
    const outsider = mount(createBox({ width: 10, height: 10 }))

    expect(() => observeActiveSection([...sections, outsider], vi.fn(), { root })).toThrow(
      'observeActiveSection: every section must be inside the root'
    )
  })

  describe('agrees with scrollToElement at the same offset', () => {
    test.each([0, 1, 2, 3])('in a bordered element root, for section %i', (index) => {
      mount(createBox({ width: 200, height: 37 }))
      const { root, sections } = mountSections([233.3, 300.6, 180.2, 90], { rootHeight: 150 })
      root.style.border = '7px solid'

      scrollToElement(root, sections[index], { offset: 40, animation: { type: 'instant' } })

      expect(recordActive(sections, { root, offset: 40 }).indices).toEqual([index])
    })

    test.each([0, 1, 2, 3])('on the window, for section %i', async (index) => {
      await page.viewport(500, 400)
      mountPage({ width: 100, height: 0 })
      const sections = [700.4, 450.7, 900.2, 120].map((height) =>
        mount(createBox({ width: 100, height }))
      )

      scrollToElement(window, sections[index], { offset: 60, animation: { type: 'instant' } })

      expect(recordActive(sections, { offset: 60 }).indices).toEqual([index])
    })
  })
})
