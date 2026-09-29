import { Component, StrictMode, useRef, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useScrollSpy } from '../../src/react'
import { mountPage } from '../helpers/dom'

const rootStyle = { height: 200, overflow: 'auto', scrollbarWidth: 'none' } as const

function recorder<T>() {
  const values: T[] = []
  return {
    values,
    record: (value: T) => values.push(value),
    latest: () => values[values.length - 1],
  }
}

function RefSpy({ onActive, offset }: { onActive: (index: number) => void; offset?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const intro = useRef<HTMLElement>(null)
  const usage = useRef<HTMLElement>(null)
  const api = useRef<HTMLElement>(null)
  onActive(useScrollSpy([intro, usage, api], { root, offset }))
  return (
    <div ref={root} aria-label="root" style={rootStyle}>
      <section ref={intro} style={{ height: 300 }} />
      <section ref={usage} style={{ height: 300 }} />
      <section ref={api} style={{ height: 100 }} />
    </div>
  )
}

function IdSpy({ ids, onActive }: { ids: string[]; onActive: (index: number) => void }) {
  onActive(useScrollSpy(ids))
  return (
    <>
      <section id="intro" style={{ height: 700 }} />
      <section id="usage" style={{ height: 700 }} />
      <section id="api" style={{ height: 700 }} />
    </>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    return error ? <p role="alert">{String(error)}</p> : this.props.children
  }
}

// React logs every error an error boundary catches.
function silenceCaughtErrorLog() {
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  onTestFinished(() => log.mockRestore())
}

function rootElement(): HTMLElement {
  const root = document.querySelector<HTMLElement>('[aria-label="root"]')
  if (!root) throw new Error('root is not rendered')
  return root
}

describe('useScrollSpy', () => {
  test('tracks sections given as refs inside a root, below an offset', async () => {
    const { record, latest } = recorder<number>()
    await render(<RefSpy onActive={record} offset={40} />)
    expect(latest()).toBe(0)

    rootElement().scrollTop = 260
    await expect.poll(() => latest()).toBe(1)

    rootElement().scrollTop = 500
    await expect.poll(() => latest()).toBe(2)
  })

  test('tracks sections given as ids on the window', async () => {
    mountPage({ width: 100, height: 0 })
    const { record, latest } = recorder<number>()
    await render(<IdSpy ids={['intro', 'usage', 'api']} onActive={record} />)
    expect(latest()).toBe(0)

    window.scrollTo({ top: 750, behavior: 'instant' })

    await expect.poll(() => latest()).toBe(1)
  })

  test('follows a change in which sections are spied', async () => {
    mountPage({ width: 100, height: 0 })
    const { record, latest } = recorder<number>()
    const screen = await render(<IdSpy ids={['intro', 'usage']} onActive={record} />)
    window.scrollTo({ top: 750, behavior: 'instant' })
    await expect.poll(() => latest()).toBe(1)

    await screen.rerender(<IdSpy ids={['usage']} onActive={record} />)

    await expect.poll(() => latest()).toBe(0)
  })

  test('keeps one subscription while re-renders pass a new but equivalent sections array', async () => {
    const { record, latest } = recorder<number>()
    const screen = await render(<RefSpy onActive={record} />)
    const addListener = vi.spyOn(rootElement(), 'addEventListener')
    const removeListener = vi.spyOn(rootElement(), 'removeEventListener')

    await screen.rerender(<RefSpy onActive={record} />)
    await screen.rerender(<RefSpy onActive={record} />)
    rootElement().scrollTop = 350

    await expect.poll(() => latest()).toBe(1)
    expect(addListener).not.toHaveBeenCalledWith('scroll', expect.anything(), expect.anything())
    expect(removeListener).not.toHaveBeenCalledWith('scroll', expect.anything())
  })

  test('keeps its subscription through StrictMode effect replays', async () => {
    const { record, latest } = recorder<number>()
    await render(<RefSpy onActive={record} />, { wrapper: StrictMode })

    rootElement().scrollTop = 350

    await expect.poll(() => latest()).toBe(1)
  })

  test('throws naming an id that matches no element', async () => {
    silenceCaughtErrorLog()
    const screen = await render(
      <ErrorBoundary>
        <IdSpy ids={['intro', 'faq']} onActive={vi.fn()} />
      </ErrorBoundary>
    )

    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('useScrollSpy: no element with id "faq"')
  })

  test('throws for a section ref that is not attached', async () => {
    silenceCaughtErrorLog()
    function Detached() {
      const attached = useRef<HTMLElement>(null)
      const detached = useRef<HTMLElement>(null)
      useScrollSpy([attached, detached])
      return <section ref={attached} />
    }

    const screen = await render(
      <ErrorBoundary>
        <Detached />
      </ErrorBoundary>
    )

    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('useScrollSpy: section ref at index 1 is not attached to an element')
  })

  test('returns -1 on the server', () => {
    function Probe() {
      return <p>{useScrollSpy(['intro'])}</p>
    }

    expect(renderToString(<Probe />)).toBe('<p>-1</p>')
  })
})
