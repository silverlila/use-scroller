import { describe, expect, onTestFinished, test, vi } from 'vitest'
import {
  animateScroll,
  cancelScroll,
  type AnimateScrollOptions,
  type ScrollAnimation,
  type ScrollDestination,
  type ScrollTarget,
} from '../../src/core'
import {
  createBox,
  createScroller,
  inlineDeclarations,
  mount,
  mountPage,
  nextFrame,
} from '../helpers/dom'
import { emulateReducedMotion } from '../helpers/media'

const quick: ScrollAnimation = { type: 'tween', duration: 60 }

// A tween held at its halfway point for a minute, so mid-animation assertions never race the clock.
function startHalfwayTween(
  target: ScrollTarget,
  to: ScrollDestination,
  options: AnimateScrollOptions = {}
) {
  const animation: ScrollAnimation = { type: 'tween', duration: 60_000, easing: () => 0.5 }
  const handle = animateScroll(target, to, { ...options, animation })
  onTestFinished(() => handle.cancel())
  return handle
}

// Frames on a hand-driven clock, so what a spring does in a given time never races the real one.
function manualClock() {
  let now = performance.now()
  let nextId = 1
  const pending = new Map<number, FrameRequestCallback>()
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    pending.set(nextId, callback)
    return nextId++
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id))
  onTestFinished(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  return {
    advance(ms: number) {
      now += ms
      const due = [...pending.values()]
      pending.clear()
      for (const callback of due) callback(now)
    },
  }
}

function mountScroller(style: Partial<CSSStyleDeclaration> = {}) {
  return mount(createScroller({ width: 200, height: 100 }, { width: 600, height: 400 }, style))
}

describe('animateScroll', () => {
  test('tweens to the target and resolves completed', async () => {
    const scroller = mountScroller()

    const handle = animateScroll(scroller, { x: 120, y: 250 })

    expect(await handle.finished).toBe('completed')
    expect(scroller.scrollLeft).toBe(120)
    expect(scroller.scrollTop).toBe(250)
  })

  test('passes through the positions its easing describes', async () => {
    const scroller = mountScroller()

    startHalfwayTween(scroller, { x: 120, y: 250 })
    await nextFrame()

    expect(scroller.scrollLeft).toBe(60)
    expect(scroller.scrollTop).toBe(125)
  })

  test('springs to the exact target on both axes', async () => {
    const scroller = mountScroller()

    const handle = animateScroll(scroller, { x: 300, y: 180 }, { animation: { type: 'spring' } })

    expect(await handle.finished).toBe('completed')
    expect(scroller.scrollLeft).toBe(300)
    expect(scroller.scrollTop).toBe(180)
  })

  test('a spring launched with a velocity toward its target covers more ground at first', () => {
    const clock = manualClock()
    const fromRest = mountScroller()
    const launched = mountScroller()

    const handles = [
      animateScroll(fromRest, { y: 300 }, { animation: { type: 'spring' } }),
      animateScroll(launched, { y: 300 }, { animation: { type: 'spring', velocity: { y: 2000 } } }),
    ]
    onTestFinished(() => handles.forEach((handle) => handle.cancel()))
    clock.advance(20)

    expect(fromRest.scrollTop).toBeGreaterThan(0)
    expect(launched.scrollTop).toBeGreaterThan(2 * fromRest.scrollTop)
  })

  test('jumps immediately with the instant animation', async () => {
    const scroller = mountScroller()

    const handle = animateScroll(scroller, { y: 200 }, { animation: { type: 'instant' } })

    expect(scroller.scrollTop).toBe(200)
    expect(await handle.finished).toBe('completed')
  })

  test('leaves an axis missing from the target where it is', async () => {
    const scroller = mountScroller()
    scroller.scrollLeft = 50

    await animateScroll(scroller, { y: 100 }, { animation: quick }).finished

    expect(scroller.scrollLeft).toBe(50)
    expect(scroller.scrollTop).toBe(100)
  })

  test('clamps a target beyond the scroll range', async () => {
    const scroller = mountScroller()
    scroller.scrollTop = 100

    await animateScroll(scroller, { x: 5000, y: -300 }, { animation: quick }).finished

    expect(scroller.scrollLeft).toBe(400)
    expect(scroller.scrollTop).toBe(0)
  })

  test('eases into the new range when the content shrinks mid-animation', async () => {
    const content = createBox({ width: 200, height: 400 })
    const scroller = mount(createBox({ width: 200, height: 100 }, { overflow: 'auto' }))
    scroller.append(content)

    startHalfwayTween(scroller, { y: 300 })
    await nextFrame()
    content.style.height = '250px'
    await nextFrame()
    await nextFrame()

    expect(scroller.scrollTop).toBe(75)
  })

  test('reaches the exact target in a scroll-behavior: smooth container', async () => {
    const scroller = mountScroller({ scrollBehavior: 'smooth' })

    await animateScroll(scroller, { x: 77, y: 233 }, { animation: quick }).finished

    expect(scroller.scrollLeft).toBe(77)
    expect(scroller.scrollTop).toBe(233)
  })

  test('rejects a negative tween duration and a non-positive spring parameter', () => {
    const scroller = mountScroller()

    expect(() =>
      animateScroll(scroller, { y: 10 }, { animation: { type: 'tween', duration: -1 } })
    ).toThrow(RangeError)
    expect(() =>
      animateScroll(scroller, { y: 10 }, { animation: { type: 'spring', damping: 0 } })
    ).toThrow(RangeError)
  })

  test('animates the window', async () => {
    mountPage({ width: 100, height: 3000 })

    const handle = animateScroll(window, { y: 1000 }, { animation: quick })

    expect(await handle.finished).toBe('completed')
    expect(window.scrollY).toBe(1000)
  })
})

describe('animateScroll cancellation', () => {
  test('a second animation on the same target cancels the first', async () => {
    const scroller = mountScroller()

    const first = startHalfwayTween(scroller, { y: 300 })
    await nextFrame()
    const second = animateScroll(scroller, { y: 50 }, { animation: quick })

    expect(await first.finished).toBe('cancelled')
    expect(await second.finished).toBe('completed')
    expect(scroller.scrollTop).toBe(50)
  })

  test('animations on different targets run independently', async () => {
    const a = mountScroller()
    const b = mountScroller()

    const first = animateScroll(a, { y: 120 }, { animation: quick })
    const second = animateScroll(b, { y: 240 }, { animation: quick })

    expect(await first.finished).toBe('completed')
    expect(await second.finished).toBe('completed')
    expect(a.scrollTop).toBe(120)
    expect(b.scrollTop).toBe(240)
  })

  test('cancel stops writing, resolves cancelled, and can be called again', async () => {
    const scroller = mountScroller()

    const handle = startHalfwayTween(scroller, { y: 300 })
    await nextFrame()
    handle.cancel()
    handle.cancel()
    scroller.scrollTop = 10
    await nextFrame()
    await nextFrame()

    expect(await handle.finished).toBe('cancelled')
    expect(scroller.scrollTop).toBe(10)
  })

  test('cancelScroll stops the animation running on a target', async () => {
    const scroller = mountScroller()

    const handle = startHalfwayTween(scroller, { y: 300 })
    await nextFrame()
    cancelScroll(scroller)
    scroller.scrollTop = 10
    await nextFrame()
    await nextFrame()

    expect(await handle.finished).toBe('cancelled')
    expect(scroller.scrollTop).toBe(10)
  })

  test('cancelScroll leaves animations on other targets running', async () => {
    const a = mountScroller()
    const b = mountScroller()

    const handle = animateScroll(b, { y: 240 }, { animation: quick })
    cancelScroll(a)

    expect(await handle.finished).toBe('completed')
    expect(b.scrollTop).toBe(240)
  })
})

describe('animateScroll interruption', () => {
  test('a wheel on the target interrupts it', async () => {
    const scroller = mountScroller()

    const handle = startHalfwayTween(scroller, { y: 300 })
    await nextFrame()
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, bubbles: true }))
    scroller.scrollTop = 10
    await nextFrame()
    await nextFrame()

    expect(await handle.finished).toBe('interrupted')
    expect(scroller.scrollTop).toBe(10)
  })

  test.each([
    ['touchstart', () => new TouchEvent('touchstart', { bubbles: true })],
    ['pointerdown', () => new PointerEvent('pointerdown', { bubbles: true })],
    ['keydown', () => new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })],
  ])('a %s inside the target interrupts it', async (_, createEvent) => {
    const scroller = mountScroller()

    const handle = startHalfwayTween(scroller, { y: 300 })
    scroller.firstElementChild?.dispatchEvent(createEvent())

    expect(await handle.finished).toBe('interrupted')
  })

  test('a keydown on the window interrupts a window animation', async () => {
    mountPage({ width: 100, height: 3000 })

    const handle = startHalfwayTween(window, { y: 2000 })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }))

    expect(await handle.finished).toBe('interrupted')
  })

  test('input does not stop a non-interruptible animation', async () => {
    const scroller = mountScroller()

    const handle = animateScroll(scroller, { y: 300 }, { animation: quick, interruptible: false })
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: 10 }))

    expect(await handle.finished).toBe('completed')
    expect(scroller.scrollTop).toBe(300)
  })
})

describe('animateScroll with reduced motion', () => {
  test('jumps straight to the target when the user prefers reduced motion', async () => {
    await emulateReducedMotion()
    const scroller = mountScroller()

    const handle = animateScroll(scroller, { y: 250 }, { animation: { type: 'spring' } })

    expect(scroller.scrollTop).toBe(250)
    expect(await handle.finished).toBe('completed')
  })

  test('still animates when told to ignore the reduced motion preference', async () => {
    await emulateReducedMotion()
    const scroller = mountScroller()

    const handle = animateScroll(
      scroller,
      { y: 250 },
      { animation: quick, respectReducedMotion: false }
    )

    expect(scroller.scrollTop).toBe(0)
    expect(await handle.finished).toBe('completed')
    expect(scroller.scrollTop).toBe(250)
  })
})

describe('animateScroll with scroll snapping', () => {
  function mountSnapScroller() {
    const scroller = mount(
      createBox({ width: 200, height: 100 }, { overflow: 'auto', scrollSnapType: 'y mandatory' })
    )
    for (let i = 0; i < 5; i++) {
      scroller.append(createBox({ width: 200, height: 100 }, { scrollSnapAlign: 'start' }))
    }
    return scroller
  }

  test('suspends snapping while animating, so frames between snap points stay put', async () => {
    const scroller = mountSnapScroller()

    startHalfwayTween(scroller, { y: 300 })
    await nextFrame()
    await nextFrame()

    expect(scroller.style.scrollSnapType).toBe('none')
    expect(scroller.scrollTop).toBe(150)
  })

  test('restores snapping when the animation completes', async () => {
    const scroller = mountSnapScroller()

    const handle = animateScroll(scroller, { y: 300 }, { animation: quick })

    expect(await handle.finished).toBe('completed')
    expect(scroller.style.scrollSnapType).toBe('y mandatory')
    expect(scroller.scrollTop).toBe(300)
  })

  test('restores snapping when the animation is cancelled', async () => {
    const scroller = mountSnapScroller()

    const handle = animateScroll(scroller, { y: 300 })
    handle.cancel()

    expect(await handle.finished).toBe('cancelled')
    expect(scroller.style.scrollSnapType).toBe('y mandatory')
  })

  test('restores an !important inline snap type with its priority', async () => {
    const scroller = mountSnapScroller()
    scroller.style.setProperty('scroll-snap-type', 'y mandatory', 'important')
    const before = inlineDeclarations(scroller)

    await animateScroll(scroller, { y: 300 }, { animation: quick }).finished

    expect(inlineDeclarations(scroller)).toEqual(before)
    expect(before['scroll-snap-type']).toBe('y mandatory !important')
  })

  test('restores an empty inline value when the snap type came from a stylesheet', async () => {
    const style = document.createElement('style')
    style.textContent = '.snap { scroll-snap-type: y mandatory }'
    mount(style)
    const scroller = mountSnapScroller()
    scroller.style.scrollSnapType = ''
    scroller.className = 'snap'

    const handle = startHalfwayTween(scroller, { y: 200 })
    await nextFrame()
    const snapTypeDuring = scroller.style.scrollSnapType
    handle.cancel()

    expect(snapTypeDuring).toBe('none')
    expect(scroller.style.scrollSnapType).toBe('')
    expect(getComputedStyle(scroller).scrollSnapType).toBe('y mandatory')
  })
})
