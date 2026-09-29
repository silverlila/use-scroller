import { createRef, useRef } from 'react'
import { describe, expect, onTestFinished, test } from 'vitest'
import { render } from 'vitest-browser-react'
import {
  useScroll,
  type AnimateScrollOptions,
  type ScrollActions,
  type ScrollAnimation,
  type ScrollHandle,
} from '../../src/react'
import { mountPage, nextFrame } from '../helpers/dom'

const instant: ScrollAnimation = { type: 'instant' }
const quick: ScrollAnimation = { type: 'tween', duration: 60 }
const heldAtHalfway: ScrollAnimation = { type: 'tween', duration: 60_000, easing: () => 0.5 }

function recorder<T>() {
  const values: T[] = []
  return {
    values,
    record: (value: T) => values.push(value),
    latest: () => values[values.length - 1],
  }
}

function ScrollBox({
  options,
  onActions,
  showBox = true,
  scrollWindow = false,
}: {
  options?: AnimateScrollOptions
  onActions: (actions: ScrollActions) => void
  showBox?: boolean
  scrollWindow?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  onActions(useScroll(scrollWindow ? 'window' : ref, options))
  if (!showBox) return null
  return (
    <div
      ref={ref}
      aria-label="box"
      style={{ width: 200, height: 100, overflow: 'auto', scrollbarWidth: 'none' }}
    >
      <div style={{ width: 600, height: 400, position: 'relative' }}>
        <div aria-label="item" style={{ position: 'absolute', left: 250, top: 220, height: 20 }} />
      </div>
    </div>
  )
}

async function renderBox(props: { options?: AnimateScrollOptions; showBox?: boolean } = {}) {
  const { record, latest, values } = recorder<ScrollActions>()
  const screen = await render(<ScrollBox {...props} onActions={record} />)
  const box = () => screen.getByLabelText('box').element()
  return { screen, box, latest, values, record }
}

function cancelOnFinish(handle: ScrollHandle): ScrollHandle {
  onTestFinished(() => handle.cancel())
  return handle
}

describe('useScroll', () => {
  test('scrollTo moves the element the ref is attached to', async () => {
    const { box, latest } = await renderBox()

    const result = await latest().scrollTo({ x: 120, y: 250 }, { animation: quick }).finished

    expect(result).toBe('completed')
    expect(box().scrollLeft).toBe(120)
    expect(box().scrollTop).toBe(250)
  })

  test('scrollBy, scrollToEdge and scrollToElement act on the attached element', async () => {
    const { box, latest } = await renderBox({ options: { animation: instant } })
    const actions = latest()

    await actions.scrollBy({ y: 40 }).finished
    await actions.scrollBy({ y: 40 }).finished
    const afterScrollBy = box().scrollTop
    await actions.scrollToEdge('bottom').finished
    const afterEdge = box().scrollTop
    const item = box().querySelector<HTMLElement>('[aria-label="item"]')
    if (!item) throw new Error('item missing')
    await actions.scrollToElement(item).finished

    expect(afterScrollBy).toBe(80)
    expect(afterEdge).toBe(300)
    expect(box().scrollLeft).toBe(250)
    expect(box().scrollTop).toBe(220)
  })

  test('scrollToElement accepts a ref', async () => {
    const itemRef = createRef<HTMLElement>()
    const { box, latest } = await renderBox({ options: { animation: instant } })
    itemRef.current = box().querySelector<HTMLElement>('[aria-label="item"]')

    await latest().scrollToElement(itemRef, { align: 'end' }).finished

    expect(box().scrollTop).toBe(140)
  })

  test('hook options are defaults that per-call options override', async () => {
    const { box, latest } = await renderBox({ options: { animation: instant } })

    latest().scrollTo({ y: 200 })
    const afterDefault = box().scrollTop
    cancelOnFinish(latest().scrollTo({ y: 0 }, { animation: heldAtHalfway }))
    await nextFrame()

    expect(afterDefault).toBe(200)
    expect(box().scrollTop).toBe(100)
  })

  test('actions read the latest hook options without changing identity', async () => {
    const { screen, box, latest, values, record } = await renderBox({
      options: { animation: heldAtHalfway },
    })
    const first = values[0]

    await screen.rerender(<ScrollBox options={{ animation: instant }} onActions={record} />)
    latest().scrollTo({ y: 200 })

    expect(box().scrollTop).toBe(200)
    expect(latest()).toBe(first)
  })

  test('actions keep their identities across re-renders', async () => {
    const { screen, values, record } = await renderBox()

    await screen.rerender(<ScrollBox options={{ interruptible: false }} onActions={record} />)
    await screen.rerender(<ScrollBox onActions={record} />)

    const [first, ...rest] = values
    for (const later of rest) {
      expect(later.scrollTo).toBe(first.scrollTo)
      expect(later.scrollBy).toBe(first.scrollBy)
      expect(later.scrollToEdge).toBe(first.scrollToEdge)
      expect(later.scrollToElement).toBe(first.scrollToElement)
      expect(later.cancel).toBe(first.cancel)
    }
  })

  test('actions act on the target from the latest render', async () => {
    mountPage({ width: 100, height: 3000 })
    const { screen, box, latest, values, record } = await renderBox({
      options: { animation: instant },
    })

    await screen.rerender(
      <ScrollBox scrollWindow options={{ animation: instant }} onActions={record} />
    )
    latest().scrollTo({ y: 200 })

    expect(window.scrollY).toBe(200)
    expect(box().scrollTop).toBe(0)
    expect(latest()).toBe(values[0])
  })

  test('cancel stops the running animation on the element', async () => {
    const { box, latest } = await renderBox()
    const handle = latest().scrollTo({ y: 300 }, { animation: heldAtHalfway })
    await nextFrame()

    latest().cancel()
    box().scrollTop = 10
    await nextFrame()
    await nextFrame()

    expect(await handle.finished).toBe('cancelled')
    expect(box().scrollTop).toBe(10)
  })

  test('unmounting cancels an animation it started', async () => {
    const { screen, latest } = await renderBox()
    const handle = latest().scrollTo({ y: 300 }, { animation: heldAtHalfway })

    await screen.unmount()

    expect(await handle.finished).toBe('cancelled')
  })

  test('actions throw while the ref is not attached', async () => {
    const { latest } = await renderBox({ showBox: false })
    const actions = latest()

    expect(() => actions.scrollTo({ y: 10 })).toThrow(
      'useScroll: ref is not attached to an element'
    )
    expect(() => actions.scrollBy({ y: 10 })).toThrow(
      'useScroll: ref is not attached to an element'
    )
    expect(() => actions.scrollToEdge('top')).toThrow(
      'useScroll: ref is not attached to an element'
    )
  })

  test('cancel does nothing while the ref is not attached', async () => {
    const { latest } = await renderBox({ showBox: false })

    expect(() => latest().cancel()).not.toThrow()
  })

  test('scrollToElement throws when given a ref that is not attached', async () => {
    const { latest } = await renderBox()

    expect(() => latest().scrollToElement({ current: null })).toThrow(
      'useScroll: scrollToElement ref is not attached to an element'
    )
  })
})

describe("useScroll('window')", () => {
  function WindowScroller({ onActions }: { onActions: (actions: ScrollActions) => void }) {
    onActions(useScroll('window', { animation: quick }))
    return null
  }

  test('scrolls the window', async () => {
    mountPage({ width: 100, height: 3000 })
    const { record, latest } = recorder<ScrollActions>()
    await render(<WindowScroller onActions={record} />)

    const result = await latest().scrollTo({ y: 700 }).finished

    expect(result).toBe('completed')
    expect(window.scrollY).toBe(700)
  })

  test('cancel stops a window animation', async () => {
    mountPage({ width: 100, height: 3000 })
    const { record, latest } = recorder<ScrollActions>()
    await render(<WindowScroller onActions={record} />)
    const handle = latest().scrollToEdge('bottom', { animation: heldAtHalfway })

    latest().cancel()

    expect(await handle.finished).toBe('cancelled')
  })
})
