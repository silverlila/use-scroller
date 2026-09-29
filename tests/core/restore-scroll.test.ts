import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { restoreScroll, type RestoreScrollOptions, type ScrollTarget } from '../../src/core'
import { createBox, createScroller, mount, mountPage, nextFrame } from '../helpers/dom'

function startRestoring(target: ScrollTarget, key: string, options?: RestoreScrollOptions) {
  const stop = restoreScroll(target, key, options)
  onTestFinished(stop)
  return stop
}

function savePosition(key: string, value: string) {
  sessionStorage.setItem(`use-scroller:${key}`, value)
  onTestFinished(() => sessionStorage.removeItem(`use-scroller:${key}`))
}

function storedPosition(key: string, storage: Storage = sessionStorage) {
  const value = storage.getItem(`use-scroller:${key}`)
  return value === null ? null : JSON.parse(value)
}

function forgetOnFinish(key: string) {
  onTestFinished(() => sessionStorage.removeItem(`use-scroller:${key}`))
}

function mountList(contentHeight: number) {
  return mount(createScroller({ width: 200, height: 100 }, { width: 200, height: contentHeight }))
}

function setContentHeight(scroller: HTMLElement, height: number) {
  const content = scroller.firstElementChild
  if (!(content instanceof HTMLElement)) throw new Error('scroller has no content element')
  content.style.height = `${height}px`
}

function nextEvent(target: EventTarget, type: string): Promise<void> {
  return new Promise((resolve) => target.addEventListener(type, () => resolve(), { once: true }))
}

async function waitFrames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

function memoryStorage(entries: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(entries))
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

function blockedStorage(): Storage {
  return {
    ...memoryStorage(),
    getItem: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  }
}

function fullStorage(): Storage {
  return {
    ...memoryStorage(),
    setItem: () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    },
  }
}

describe('restoreScroll', () => {
  test('saves the position after the user scrolls', async () => {
    forgetOnFinish('saves')
    const list = mountList(1000)
    startRestoring(list, 'saves')

    list.scrollTop = 300

    await vi.waitFor(() => expect(storedPosition('saves')).toEqual({ x: 0, y: 300 }))
  })

  test('restores a saved position instantly when it is already reachable', () => {
    savePosition('restores', '{"x":0,"y":250}')
    const list = mountList(1000)

    startRestoring(list, 'restores')

    expect(list.scrollTop).toBe(250)
  })

  test('restores a horizontal position', () => {
    savePosition('horizontal', '{"x":120,"y":0}')
    const track = mount(createScroller({ width: 200, height: 100 }, { width: 800, height: 100 }))

    startRestoring(track, 'horizontal')

    expect(track.scrollLeft).toBe(120)
  })

  test('waits for content that grows later, then restores', async () => {
    savePosition('grows', '{"x":0,"y":600}')
    const list = mountList(300)
    startRestoring(list, 'grows')
    await waitFrames(3)
    expect(list.scrollTop).toBe(0)

    setContentHeight(list, 1000)

    await vi.waitFor(() => expect(list.scrollTop).toBe(600))
  })

  test.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])(
    'stops waiting when the user interacts first (%s)',
    async (type) => {
      savePosition(`interaction-${type}`, '{"x":0,"y":600}')
      const list = mountList(300)
      startRestoring(list, `interaction-${type}`)

      list.dispatchEvent(new Event(type, { bubbles: true }))
      setContentHeight(list, 1000)
      await waitFrames(3)

      expect(list.scrollTop).toBe(0)
    }
  )

  test('saves once the user has taken over from a pending restore', async () => {
    savePosition('taken-over', '{"x":0,"y":600}')
    const list = mountList(300)
    startRestoring(list, 'taken-over')

    list.dispatchEvent(new Event('wheel'))
    list.scrollTop = 50

    await vi.waitFor(() => expect(storedPosition('taken-over')).toEqual({ x: 0, y: 50 }))
  })

  test('on timeout, restores as close as it can and stops waiting', async () => {
    savePosition('timeout', '{"x":0,"y":600}')
    const list = mountList(300)
    startRestoring(list, 'timeout', { timeout: 10 })

    await vi.waitFor(() => expect(list.scrollTop).toBe(200))
    setContentHeight(list, 1000)
    await waitFrames(3)

    expect(list.scrollTop).toBe(200)
  })

  test('does not overwrite the saved position while it is still waiting to restore', async () => {
    savePosition('pending', '{"x":0,"y":600}')
    const list = mountList(300)
    const stop = startRestoring(list, 'pending')

    list.scrollTop = 100
    await nextEvent(list, 'scroll')
    await waitFrames(2)
    stop()

    expect(storedPosition('pending')).toEqual({ x: 0, y: 600 })
  })

  test.each([
    ['not JSON', 'not json'],
    ['a string coordinate', '{"x":0,"y":"250"}'],
    ['a missing coordinate', '{"y":250}'],
    ['an infinite coordinate', '{"x":0,"y":1e999}'],
    ['null', 'null'],
  ])('ignores a stored value that is %s', async (_, value) => {
    savePosition('corrupt', value)
    const list = mountList(1000)
    startRestoring(list, 'corrupt')
    expect(list.scrollTop).toBe(0)

    list.scrollTop = 300

    await vi.waitFor(() => expect(storedPosition('corrupt')).toEqual({ x: 0, y: 300 }))
  })

  test('does nothing when storage is blocked', async () => {
    const list = mountList(1000)
    const stop = startRestoring(list, 'blocked', { storage: blockedStorage() })

    list.scrollTop = 300
    await nextEvent(list, 'scroll')
    await waitFrames(2)
    stop()

    expect(list.scrollTop).toBe(300)
  })

  test('keeps working when storage refuses writes', async () => {
    const list = mountList(1000)
    const stop = startRestoring(list, 'full', { storage: fullStorage() })

    list.scrollTop = 300
    await nextEvent(list, 'scroll')
    stop()
    list.scrollTop = 100
    await waitFrames(2)

    expect(list.scrollTop).toBe(100)
  })

  test('reads and writes a custom storage instead of sessionStorage', async () => {
    const storage = memoryStorage({ 'use-scroller:custom': '{"x":0,"y":250}' })
    const list = mountList(1000)
    startRestoring(list, 'custom', { storage })
    expect(list.scrollTop).toBe(250)

    list.scrollTop = 400

    await vi.waitFor(() => expect(storedPosition('custom', storage)).toEqual({ x: 0, y: 400 }))
    expect(storedPosition('custom')).toBeNull()
  })

  test('saves a scroll that has not been saved yet on cleanup', async () => {
    forgetOnFinish('cleanup')
    const list = mountList(1000)
    const stop = startRestoring(list, 'cleanup')

    list.scrollTop = 300
    await nextEvent(list, 'scroll')
    stop()

    expect(storedPosition('cleanup')).toEqual({ x: 0, y: 300 })
  })

  test('saves a scroll that has not been saved yet when the page is hidden', async () => {
    forgetOnFinish('pagehide')
    const list = mountList(1000)
    startRestoring(list, 'pagehide')

    list.scrollTop = 300
    await nextEvent(list, 'scroll')
    window.dispatchEvent(new PageTransitionEvent('pagehide'))

    expect(storedPosition('pagehide')).toEqual({ x: 0, y: 300 })
  })

  test('stops saving after cleanup', async () => {
    forgetOnFinish('stopped')
    const list = mountList(1000)
    restoreScroll(list, 'stopped')()

    list.scrollTop = 300
    await nextEvent(list, 'scroll')
    await waitFrames(2)

    expect(storedPosition('stopped')).toBeNull()
  })

  test('rejects a timeout setTimeout cannot honor', () => {
    const list = mountList(1000)

    expect(() => restoreScroll(list, 'invalid', { timeout: -1 })).toThrow(RangeError)
    expect(() => restoreScroll(list, 'invalid', { timeout: 2 ** 31 })).toThrow(RangeError)
  })
})

describe('restoreScroll on the window', () => {
  function keepHistoryRestoration() {
    const previous = history.scrollRestoration
    onTestFinished(() => {
      history.scrollRestoration = previous
    })
  }

  test('restores the page position', () => {
    savePosition('page', '{"x":0,"y":500}')
    mountPage({ width: 100, height: 3000 })

    startRestoring(window, 'page')

    expect(window.scrollY).toBe(500)
  })

  test('takes over history.scrollRestoration while active and puts it back after', () => {
    keepHistoryRestoration()
    history.scrollRestoration = 'auto'
    forgetOnFinish('history')

    const stop = restoreScroll(window, 'history')
    expect(history.scrollRestoration).toBe('manual')
    stop()

    expect(history.scrollRestoration).toBe('auto')
  })

  test('keeps history.scrollRestoration manual until the last window restorer stops', () => {
    keepHistoryRestoration()
    history.scrollRestoration = 'auto'
    forgetOnFinish('first-page')
    forgetOnFinish('second-page')

    const stopFirst = restoreScroll(window, 'first-page')
    const stopSecond = restoreScroll(window, 'second-page')
    stopFirst()
    expect(history.scrollRestoration).toBe('manual')
    stopSecond()

    expect(history.scrollRestoration).toBe('auto')
  })

  test('stops waiting when the user presses a key on the page', async () => {
    savePosition('page-key', '{"x":0,"y":2000}')
    mountPage({ width: 100, height: 1000 })
    startRestoring(window, 'page-key')

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    mount(createBox({ width: 100, height: 3000 }))
    await waitFrames(3)

    expect(window.scrollY).toBe(0)
  })
})
