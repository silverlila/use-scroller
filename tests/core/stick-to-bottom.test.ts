import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { stickToBottom, type ScrollAnimation, type ScrollHandle } from '../../src/core'
import { createBox, createScroller, mount, nextFrame } from '../helpers/dom'
import { pointIn, touchscreen } from '../helpers/pointer'

const heldAtHalfway: ScrollAnimation = { type: 'tween', duration: 60_000, easing: () => 0.5 }

function mountChat() {
  return mount(createScroller({ width: 200, height: 100 }, { width: 200, height: 400 }))
}

function attach(element: HTMLElement) {
  const changes: boolean[] = []
  const sticking = stickToBottom(element, (isAtBottom) => changes.push(isAtBottom))
  onTestFinished(() => sticking.stop())
  return { changes, sticking }
}

function appendMessage(element: HTMLElement, height: number) {
  element.append(createBox({ width: 200, height }))
}

function growLastChild(element: HTMLElement, by: number) {
  const last = element.lastElementChild
  if (!(last instanceof HTMLElement)) throw new Error('fixture has no last child to grow')
  last.style.height = `${last.offsetHeight + by}px`
}

async function frames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

function cancelOnFinish(handle: ScrollHandle): ScrollHandle {
  onTestFinished(() => handle.cancel())
  return handle
}

describe('stickToBottom', () => {
  test('jumps to the bottom on attach and reports being at the bottom once', () => {
    const chat = mountChat()

    const { changes } = attach(chat)

    expect(chat.scrollTop).toBe(300)
    expect(changes).toEqual([true])
  })

  test('follows appended messages while stuck', async () => {
    const chat = mountChat()
    attach(chat)

    appendMessage(chat, 100)
    await vi.waitFor(() => expect(chat.scrollTop).toBe(400))
    appendMessage(chat, 50)
    await vi.waitFor(() => expect(chat.scrollTop).toBe(450))
  })

  test('follows a streaming reply that grows the last message', async () => {
    const chat = mountChat()
    appendMessage(chat, 20)
    attach(chat)

    growLastChild(chat, 30)
    await vi.waitFor(() => expect(chat.scrollTop).toBe(350))
    growLastChild(chat, 30)
    await vi.waitFor(() => expect(chat.scrollTop).toBe(380))
  })

  test('follows streaming text that grows in place directly inside the element', async () => {
    const log = mount(
      createBox(
        { width: 200, height: 100 },
        { overflow: 'auto', scrollbarWidth: 'none', whiteSpace: 'pre', lineHeight: '20px' }
      )
    )
    const text = document.createTextNode('line\n'.repeat(10))
    log.append(text)
    // Already at the bottom, so attaching scrolls nothing: the idle re-measure after a scroll
    // event would otherwise pick up the growth and hide a missed size change.
    log.scrollTop = 100
    await frames(3)
    attach(log)
    await frames(3)

    text.data += 'line\n'.repeat(5)

    await vi.waitFor(() => expect(log.scrollTop).toBe(200))
  })

  test('follows when the element itself shrinks', async () => {
    const chat = mountChat()
    attach(chat)

    chat.style.height = '60px'

    await vi.waitFor(() => expect(chat.scrollTop).toBe(340))
  })

  test('a user scrolling up unsticks and stops following', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)

    chat.scrollTop = 200
    await vi.waitFor(() => expect(changes).toEqual([true, false]))
    appendMessage(chat, 100)
    await frames(3)

    expect(chat.scrollHeight).toBe(500)
    expect(chat.scrollTop).toBe(200)
  })

  test('a touch drag up unsticks', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)
    const finger = touchscreen()

    await finger.down(pointIn(chat, { x: 100, y: 20 }))
    for (const y of [30, 50, 70, 90]) await finger.move(pointIn(chat, { x: 100, y }))
    finger.pause(300)
    await finger.up()

    await vi.waitFor(() => expect(changes).toEqual([true, false]))
    expect(chat.scrollTop).toBeLessThan(292)
  })

  test('content growth while unstuck leaves the position alone', async () => {
    const chat = mountChat()
    appendMessage(chat, 20)
    attach(chat)
    chat.scrollTop = 150
    await vi.waitFor(() => expect(chat.scrollTop).toBe(150))

    growLastChild(chat, 200)
    await frames(3)

    expect(chat.scrollHeight).toBe(620)
    expect(chat.scrollTop).toBe(150)
  })

  test('drifting up by less than the threshold stays stuck and keeps following', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)

    chat.scrollTop = 292
    await frames(2)
    appendMessage(chat, 100)

    await vi.waitFor(() => expect(chat.scrollTop).toBe(400))
    expect(changes).toEqual([true])
  })

  test('scrolling up while a message arrives in the same frame unsticks without jumping', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)

    chat.scrollTop = 250
    appendMessage(chat, 100)

    await vi.waitFor(() => expect(changes).toEqual([true, false]))
    await frames(2)
    expect(chat.scrollTop).toBe(250)
  })

  test('a slow drag up while a reply streams in still escapes', async () => {
    const chat = mountChat()
    appendMessage(chat, 20)
    const { changes } = attach(chat)

    for (let step = 0; step < 6; step++) {
      chat.scrollTop -= 3
      growLastChild(chat, 3)
      await frames(2)
    }

    expect(changes).toEqual([true, false])
    expect(chat.scrollHeight - chat.clientHeight - chat.scrollTop).toBeGreaterThan(8)
  })

  test('scrolling back to within 8px of the bottom re-sticks and follows again', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)
    chat.scrollTop = 100
    await vi.waitFor(() => expect(changes).toEqual([true, false]))

    chat.scrollTop = 292
    await vi.waitFor(() => expect(changes).toEqual([true, false, true]))
    appendMessage(chat, 100)

    await vi.waitFor(() => expect(chat.scrollTop).toBe(400))
  })

  test('stays unstuck 9px above the bottom', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)

    chat.scrollTop = 291
    await vi.waitFor(() => expect(changes).toEqual([true, false]))
  })

  test('reports only transitions', async () => {
    const chat = mountChat()
    const { changes } = attach(chat)

    chat.scrollTop = 200
    await vi.waitFor(() => expect(changes).toEqual([true, false]))
    chat.scrollTop = 150
    appendMessage(chat, 50)
    await frames(3)
    chat.scrollTop = 350
    await vi.waitFor(() => expect(changes).toEqual([true, false, true]))
    appendMessage(chat, 50)
    await vi.waitFor(() => expect(chat.scrollTop).toBe(400))

    expect(changes).toEqual([true, false, true])
  })

  describe('scrollToBottom', () => {
    test('animates down and re-sticks straight away', async () => {
      const chat = mountChat()
      const { changes, sticking } = attach(chat)
      chat.scrollTop = 100
      await vi.waitFor(() => expect(changes).toEqual([true, false]))

      cancelOnFinish(sticking.scrollToBottom({ animation: heldAtHalfway }))

      expect(changes).toEqual([true, false, true])
      await vi.waitFor(() => expect(chat.scrollTop).toBe(200))
    })

    test('lands on the bottom and follows new messages afterwards', async () => {
      const chat = mountChat()
      const { changes, sticking } = attach(chat)
      chat.scrollTop = 100
      await vi.waitFor(() => expect(changes).toEqual([true, false]))

      const result = await sticking.scrollToBottom({ animation: { type: 'tween', duration: 60 } })
        .finished
      appendMessage(chat, 100)

      expect(result).toBe('completed')
      await vi.waitFor(() => expect(chat.scrollTop).toBe(400))
      expect(changes).toEqual([true, false, true])
    })

    test('reaches content that arrives while it animates', async () => {
      const chat = mountChat()
      const { changes, sticking } = attach(chat)
      chat.scrollTop = 0
      await vi.waitFor(() => expect(changes).toEqual([true, false]))

      const handle = sticking.scrollToBottom({ animation: { type: 'tween', duration: 200 } })
      await nextFrame()
      appendMessage(chat, 100)

      expect(await handle.finished).toBe('completed')
      expect(chat.scrollTop).toBe(400)
      expect(changes).toEqual([true, false, true])
    })

    test('unsticks when the user interrupts it short of the bottom', async () => {
      const chat = mountChat()
      const { changes, sticking } = attach(chat)
      chat.scrollTop = 100
      await vi.waitFor(() => expect(changes).toEqual([true, false]))
      const handle = cancelOnFinish(sticking.scrollToBottom({ animation: heldAtHalfway }))
      await vi.waitFor(() => expect(chat.scrollTop).toBe(200))

      chat.dispatchEvent(new WheelEvent('wheel', { deltaY: -10 }))

      expect(await handle.finished).toBe('interrupted')
      expect(changes).toEqual([true, false, true, false])
    })
  })

  describe('stop', () => {
    test('stops following and reporting', async () => {
      const chat = mountChat()
      const { changes, sticking } = attach(chat)

      sticking.stop()
      appendMessage(chat, 100)
      await frames(3)
      chat.scrollTop = 0
      await frames(3)

      expect(chat.scrollTop).toBe(0)
      expect(changes).toEqual([true])
    })

    test('cancels a running scrollToBottom without reporting', async () => {
      const chat = mountChat()
      const { changes, sticking } = attach(chat)
      chat.scrollTop = 100
      await vi.waitFor(() => expect(changes).toEqual([true, false]))
      const handle = sticking.scrollToBottom({ animation: heldAtHalfway })

      sticking.stop()

      expect(await handle.finished).toBe('cancelled')
      expect(changes).toEqual([true, false, true])
    })

    test('scrollToBottom after stop throws', () => {
      const { sticking } = attach(mountChat())

      sticking.stop()

      expect(() => sticking.scrollToBottom()).toThrow(
        'stickToBottom: scrollToBottom called after stop()'
      )
    })
  })
})
