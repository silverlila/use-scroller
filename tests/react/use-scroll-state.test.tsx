import { StrictMode, useRef, type RefObject } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { initialScrollState } from '../../src/core/observe-scroll'
import { useScrollState, type ScrollState } from '../../src/react'
import { mountPage, nextFrame } from '../helpers/dom'

const viewport = { width: 200, height: 100, overflow: 'auto', scrollbarWidth: 'none' } as const

function ScrollBox({
  label,
  contentHeight = 400,
  onState,
}: {
  label: string
  contentHeight?: number
  onState: (state: ScrollState) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  onState(useScrollState(ref))
  return (
    <div ref={ref} aria-label={label} style={viewport}>
      <div style={{ height: contentHeight }} />
    </div>
  )
}

function recorder<T>() {
  const values: T[] = []
  return {
    values,
    record: (value: T) => values.push(value),
    latest: () => values[values.length - 1],
  }
}

describe('useScrollState', () => {
  test('reflects the element it is attached to', async () => {
    const { record, latest } = recorder<ScrollState>()

    await render(<ScrollBox label="box" onState={record} />)

    expect(latest()).toMatchObject({ y: 0, maxY: 300, atTop: true, atBottom: false })
  })

  test('reflects edges after the element scrolls', async () => {
    const { record, latest } = recorder<ScrollState>()
    const screen = await render(<ScrollBox label="box" onState={record} />)

    screen.getByLabelText('box').element().scrollTop = 300

    await expect.poll(() => latest()).toMatchObject({ y: 300, atTop: false, atBottom: true })
  })

  test('keeps its subscription through StrictMode effect replays', async () => {
    const { record, latest } = recorder<ScrollState>()
    const screen = await render(<ScrollBox label="box" onState={record} />, {
      wrapper: StrictMode,
    })

    screen.getByLabelText('box').element().scrollTop = 300

    await expect.poll(() => latest()).toMatchObject({ y: 300, atBottom: true })
  })

  test('returns the initial state on the server', () => {
    function Probe() {
      const ref = useRef<HTMLDivElement>(null)
      const state = useScrollState(ref)
      return <div ref={ref}>{JSON.stringify(state)}</div>
    }

    const html = renderToString(<Probe />)

    expect(html).toBe(`<div>${JSON.stringify(initialScrollState).replace(/"/g, '&quot;')}</div>`)
  })

  test.each([
    ['', undefined],
    [' under StrictMode', StrictMode],
  ])('subscribes to an element that comes after the hook in tree order%s', async (_, wrapper) => {
    const { values, record, latest } = recorder<ScrollState>()
    function Consumer({ target }: { target: RefObject<HTMLDivElement | null> }) {
      record(useScrollState(target))
      return null
    }
    function Layout() {
      const ref = useRef<HTMLDivElement>(null)
      return (
        <>
          <Consumer target={ref} />
          <div ref={ref} aria-label="later" style={viewport}>
            <div style={{ height: 400 }} />
          </div>
        </>
      )
    }
    const screen = await render(<Layout />, { wrapper })

    await expect.poll(() => latest()).toMatchObject({ maxY: 300, canScrollY: true })
    screen.getByLabelText('later').element().scrollTop = 300
    await expect.poll(() => latest()).toMatchObject({ y: 300, atBottom: true })
    expect(values[0]).toEqual(initialScrollState)
  })

  test('picks up an element that is rendered after the hook mounts', async () => {
    const { record, latest } = recorder<ScrollState>()
    function Conditional({ show }: { show: boolean }) {
      const ref = useRef<HTMLDivElement>(null)
      record(useScrollState(ref))
      return show ? (
        <div ref={ref} aria-label="late" style={viewport}>
          <div style={{ height: 250 }} />
        </div>
      ) : null
    }
    const screen = await render(<Conditional show={false} />)
    expect(latest()).toEqual(initialScrollState)

    await screen.rerender(<Conditional show />)
    await expect.poll(() => latest()).toMatchObject({ maxY: 150, canScrollY: true })

    screen.getByLabelText('late').element().scrollTop = 150
    await expect.poll(() => latest()).toMatchObject({ y: 150, atBottom: true })
  })

  test('follows the ref when it moves to a different element', async () => {
    const { record, latest } = recorder<ScrollState>()
    function Swappable({ contentHeight }: { contentHeight: number }) {
      const ref = useRef<HTMLDivElement>(null)
      record(useScrollState(ref))
      return (
        <div key={contentHeight} ref={ref} style={viewport}>
          <div style={{ height: contentHeight }} />
        </div>
      )
    }
    const screen = await render(<Swappable contentHeight={400} />)
    await expect.poll(() => latest()).toMatchObject({ maxY: 300 })

    await screen.rerender(<Swappable contentHeight={180} />)

    await expect.poll(() => latest()).toMatchObject({ maxY: 80 })
  })

  test('tracks the window', async () => {
    mountPage({ width: 100, height: 3000 })
    const { record, latest } = recorder<ScrollState>()
    function WindowProbe() {
      record(useScrollState('window'))
      return null
    }
    await render(<WindowProbe />)

    window.scrollTo({ top: 500, behavior: 'instant' })

    await expect.poll(() => latest()).toMatchObject({ y: 500, atTop: false, canScrollY: true })
  })
})

describe('useScrollState with a selector', () => {
  function SelectedBox({
    label,
    select,
    onValue,
  }: {
    label: string
    select: (state: ScrollState) => unknown
    onValue: (value: unknown) => void
  }) {
    const ref = useRef<HTMLDivElement>(null)
    onValue(useScrollState(ref, select))
    return (
      <div ref={ref} aria-label={label} style={viewport}>
        <div style={{ height: 400 }} />
      </div>
    )
  }

  test('re-renders only when the selected value changes', async () => {
    const watched = recorder<unknown>()
    const control = recorder<unknown>()
    const screen = await render(
      <>
        <SelectedBox label="watched" select={(s) => s.atBottom} onValue={watched.record} />
        <SelectedBox label="control" select={(s) => s.y} onValue={control.record} />
      </>
    )
    const watchedBox = screen.getByLabelText('watched').element()
    const controlBox = screen.getByLabelText('control').element()
    await nextFrame()
    const rendersBefore = watched.values.length

    watchedBox.scrollTop = 120
    controlBox.scrollTop = 120
    await expect.poll(() => control.latest()).toBe(120)
    await nextFrame()
    await nextFrame()
    const rendersAfterUnrelatedChange = watched.values.length

    watchedBox.scrollTop = 300
    await expect.poll(() => watched.latest()).toBe(true)

    expect(rendersAfterUnrelatedChange).toBe(rendersBefore)
    expect(watched.values.length).toBeGreaterThan(rendersAfterUnrelatedChange)
  })

  test('applies a selector passed on a later render', async () => {
    const { record, latest } = recorder<unknown>()
    const screen = await render(<SelectedBox label="box" select={(s) => s.maxY} onValue={record} />)
    await expect.poll(() => latest()).toBe(300)

    await screen.rerender(<SelectedBox label="box" select={(s) => s.canScrollX} onValue={record} />)

    expect(latest()).toBe(false)
  })

  test('accepts a selector that builds a new object on every call', async () => {
    const { record, latest } = recorder<unknown>()
    const screen = await render(
      <SelectedBox
        label="box"
        select={(s) => ({ top: s.atTop, bottom: s.atBottom })}
        onValue={record}
      />
    )

    screen.getByLabelText('box').element().scrollTop = 300

    await expect.poll(() => latest()).toEqual({ top: false, bottom: true })
  })
})
