import { StrictMode, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useInView, type InView, type InViewOptions } from '../../src/react'
import { mountPage } from '../helpers/dom'

const rootStyle = { height: 100, overflow: 'auto', scrollbarWidth: 'none' } as const

function recorder<T>() {
  const values: T[] = []
  return {
    record: (value: T) => values.push(value),
    latest: () => values[values.length - 1],
  }
}

function Watched({
  options,
  onView,
  onLiveView = () => undefined,
}: {
  options?: Omit<InViewOptions, 'root'>
  onView: (view: InView) => void
  onLiveView?: (view: InView) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const target = useRef<HTMLDivElement>(null)
  onView(useInView(target, { root, ...options }))
  onLiveView(useInView(target, { root }))
  return (
    <div ref={root} aria-label="root" style={rootStyle}>
      <div style={{ height: 300 }} />
      <div ref={target} aria-label="target" style={{ height: 50 }} />
      <div style={{ height: 300 }} />
    </div>
  )
}

function byLabel(label: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[aria-label="${label}"]`)
  if (!element) throw new Error(`${label} is not rendered`)
  return element
}

describe('useInView', () => {
  test('flips when the element is scrolled into view and back out', async () => {
    const { record, latest } = recorder<InView>()
    await render(<Watched onView={record} />, { wrapper: StrictMode })
    await vi.waitFor(() => expect(latest().entry).not.toBeNull())
    expect(latest().inView).toBe(false)

    byLabel('root').scrollTop = 250
    await vi.waitFor(() => expect(latest().inView).toBe(true))
    expect(latest().entry?.target).toBe(byLabel('target'))

    byLabel('root').scrollTop = 0
    await vi.waitFor(() => expect(latest().inView).toBe(false))
  })

  test('with once, stays in view after scrolling away', async () => {
    const once = recorder<InView>()
    const live = recorder<InView>()
    await render(<Watched options={{ once: true }} onView={once.record} onLiveView={live.record} />)

    byLabel('root').scrollTop = 250
    await vi.waitFor(() => expect(once.latest().inView).toBe(true))
    byLabel('root').scrollTop = 0
    await vi.waitFor(() => expect(live.latest().inView).toBe(false))

    expect(once.latest().inView).toBe(true)
  })

  test('counts an element below its threshold as out of view while a sliver remains', async () => {
    const { record, latest } = recorder<InView>()
    await render(<Watched options={{ threshold: 0.5 }} onView={record} />)

    byLabel('root').scrollTop = 250
    await vi.waitFor(() => expect(latest().inView).toBe(true))
    byLabel('root').scrollTop = 210

    await vi.waitFor(() => expect(latest().inView).toBe(false))
    expect(latest().entry?.intersectionRatio).toBeCloseTo(0.2, 1)
  })

  test('observes against the window viewport by default', async () => {
    mountPage({ width: 100, height: 0 })
    const { record, latest } = recorder<InView>()
    function PageWatched() {
      const target = useRef<HTMLDivElement>(null)
      record(useInView(target))
      return (
        <>
          <div style={{ height: 2000 }} />
          <div ref={target} style={{ height: 50 }} />
        </>
      )
    }
    await render(<PageWatched />)
    await vi.waitFor(() => expect(latest().entry).not.toBeNull())
    expect(latest().inView).toBe(false)

    window.scrollTo({ top: 1500, behavior: 'instant' })

    await vi.waitFor(() => expect(latest().inView).toBe(true))
  })

  test('reports out of view on the server', () => {
    function Probe() {
      const target = useRef<HTMLDivElement>(null)
      return <div ref={target}>{JSON.stringify(useInView(target))}</div>
    }

    expect(renderToString(<Probe />)).toBe(
      `<div>${JSON.stringify({ inView: false, entry: null }).replace(/"/g, '&quot;')}</div>`
    )
  })
})
