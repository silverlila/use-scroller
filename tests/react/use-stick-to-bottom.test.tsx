import { StrictMode, useRef } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useStickToBottom, type StickToBottomState } from '../../src/react'
import { nextFrame } from '../helpers/dom'

function Chat({
  messages,
  show = true,
  onState,
}: {
  messages: number
  show?: boolean
  onState: (state: StickToBottomState) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  onState(useStickToBottom(ref))
  if (!show) return null
  return (
    <div
      ref={ref}
      aria-label="chat"
      style={{ width: 200, height: 100, overflow: 'auto', scrollbarWidth: 'none' }}
    >
      {Array.from({ length: messages }, (_, i) => (
        <div key={i} style={{ height: 50 }} />
      ))}
    </div>
  )
}

async function renderChat(props: { messages: number; show?: boolean }, options = {}) {
  const states: StickToBottomState[] = []
  const record = (state: StickToBottomState) => states.push(state)
  const screen = await render(<Chat {...props} onState={record} />, options)
  const chat = () => screen.getByLabelText('chat').element()
  const rerender = (next: { messages: number; show?: boolean }) =>
    screen.rerender(<Chat {...next} onState={record} />)
  return { chat, rerender, states, latest: () => states[states.length - 1] }
}

describe('useStickToBottom', () => {
  test.each([
    ['', {}],
    [' under StrictMode', { wrapper: StrictMode }],
  ])('starts at the bottom%s', async (_, options) => {
    const { chat, latest } = await renderChat({ messages: 8 }, options)

    expect(chat().scrollTop).toBe(300)
    expect(latest().isAtBottom).toBe(true)
  })

  test('follows new messages while at the bottom', async () => {
    const { chat, rerender } = await renderChat({ messages: 8 })

    await rerender({ messages: 10 })

    await vi.waitFor(() => expect(chat().scrollTop).toBe(400))
  })

  test('reports leaving the bottom and stops following', async () => {
    const { chat, rerender, latest } = await renderChat({ messages: 8 })

    chat().scrollTop = 100
    await vi.waitFor(() => expect(latest().isAtBottom).toBe(false))
    await rerender({ messages: 10 })
    await nextFrame()
    await nextFrame()

    expect(chat().scrollTop).toBe(100)
  })

  test('scrollToBottom returns to the bottom and reports it', async () => {
    const { chat, latest } = await renderChat({ messages: 8 })
    chat().scrollTop = 100
    await vi.waitFor(() => expect(latest().isAtBottom).toBe(false))

    const result = await latest().scrollToBottom({ animation: { type: 'instant' } }).finished

    expect(result).toBe('completed')
    expect(chat().scrollTop).toBe(300)
    await vi.waitFor(() => expect(latest().isAtBottom).toBe(true))
  })

  test('scrollToBottom keeps its identity across re-renders', async () => {
    const { rerender, states } = await renderChat({ messages: 8 })

    await rerender({ messages: 9 })
    await rerender({ messages: 10 })

    const [first, ...rest] = states
    for (const later of rest) expect(later.scrollToBottom).toBe(first.scrollToBottom)
  })

  test('attaches to an element that mounts later', async () => {
    const { chat, rerender } = await renderChat({ messages: 8, show: false })

    await rerender({ messages: 8, show: true })

    await vi.waitFor(() => expect(chat().scrollTop).toBe(300))
  })

  test('scrollToBottom throws while the ref is not attached', async () => {
    const { rerender, latest } = await renderChat({ messages: 8 })

    await rerender({ messages: 8, show: false })

    expect(() => latest().scrollToBottom()).toThrow(
      'useStickToBottom: ref is not attached to an element'
    )
  })
})
