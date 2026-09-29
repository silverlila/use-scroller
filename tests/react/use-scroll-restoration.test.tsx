import { StrictMode, useRef } from 'react'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useScrollRestoration } from '../../src/react'
import { mountPage } from '../helpers/dom'

const viewport = { width: 200, height: 100, overflow: 'auto', scrollbarWidth: 'none' } as const

function List({ storageKey }: { storageKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollRestoration(ref, storageKey)
  return (
    <div ref={ref} aria-label="list" style={viewport}>
      <div style={{ height: 1000 }} />
    </div>
  )
}

function SwappedList({ route }: { route: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollRestoration(ref, route)
  return (
    <div key={route} ref={ref} aria-label="list" style={viewport}>
      <div style={{ height: 1000 }} />
    </div>
  )
}

function Page() {
  useScrollRestoration('window', 'page')
  return null
}

function savePosition(key: string, value: string) {
  sessionStorage.setItem(`use-scroller:${key}`, value)
  onTestFinished(() => sessionStorage.removeItem(`use-scroller:${key}`))
}

function storedPosition(key: string) {
  const value = sessionStorage.getItem(`use-scroller:${key}`)
  return value === null ? null : JSON.parse(value)
}

describe('useScrollRestoration', () => {
  test('restores the saved position of the element it is attached to', async () => {
    savePosition('list', '{"x":0,"y":250}')

    const screen = await render(<List storageKey="list" />, { wrapper: StrictMode })

    expect(screen.getByLabelText('list').element().scrollTop).toBe(250)
  })

  test('saves the position as the element scrolls', async () => {
    savePosition('list', '{"x":0,"y":250}')
    const screen = await render(<List storageKey="list" />)

    screen.getByLabelText('list').element().scrollTop = 400

    await vi.waitFor(() => expect(storedPosition('list')).toEqual({ x: 0, y: 400 }))
  })

  test('switches to the position saved under a new key', async () => {
    savePosition('first', '{"x":0,"y":100}')
    savePosition('second', '{"x":0,"y":400}')
    const screen = await render(<List storageKey="first" />)
    const list = screen.getByLabelText('list').element()

    await screen.rerender(<List storageKey="second" />)
    expect(list.scrollTop).toBe(400)
    list.scrollTop = 50
    await vi.waitFor(() => expect(storedPosition('second')).toEqual({ x: 0, y: 50 }))
    await screen.rerender(<List storageKey="first" />)

    expect(list.scrollTop).toBe(100)
    expect(storedPosition('first')).toEqual({ x: 0, y: 100 })
  })

  test('keeps the saved position of an element that was swapped out', async () => {
    savePosition('inbox', '{"x":0,"y":0}')
    savePosition('archive', '{"x":0,"y":300}')
    const screen = await render(<SwappedList route="inbox" />)

    screen.getByLabelText('list').element().scrollTop = 150
    await vi.waitFor(() => expect(storedPosition('inbox')).toEqual({ x: 0, y: 150 }))
    await screen.rerender(<SwappedList route="archive" />)

    expect(screen.getByLabelText('list').element().scrollTop).toBe(300)
    expect(storedPosition('inbox')).toEqual({ x: 0, y: 150 })
  })

  test('restores the page position for a window target', async () => {
    savePosition('page', '{"x":0,"y":500}')
    mountPage({ width: 100, height: 3000 })
    const previous = history.scrollRestoration
    onTestFinished(() => {
      history.scrollRestoration = previous
    })

    const screen = await render(<Page />)
    expect(window.scrollY).toBe(500)
    expect(history.scrollRestoration).toBe('manual')
    await screen.unmount()

    expect(history.scrollRestoration).toBe(previous)
  })
})
