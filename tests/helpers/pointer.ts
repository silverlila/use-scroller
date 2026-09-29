/// <reference types="@vitest/browser-playwright" />
import { cdp } from 'vitest/browser'
import { nextFrame } from './dom'

export interface Point {
  x: number
  y: number
}

const STEP_MS = 16

// CDP input is trusted: real pointer ids (so pointer capture works), real touch-action, real clicks.
// It takes main-frame coordinates, and the test iframe is offset and scaled inside that frame.
function toMainFrame(point: Point): Point {
  let { x, y } = point
  for (let win: Window = window; win.frameElement; win = win.parent) {
    const frame = win.frameElement.getBoundingClientRect()
    const scale = frame.width / win.innerWidth
    x = frame.left + x * scale
    y = frame.top + y * scale
  }
  return { x, y }
}

// Event timestamps are ours to set, so velocity never depends on how fast the test runs.
function clock() {
  let seconds = Date.now() / 1000
  return {
    tick: () => (seconds += STEP_MS / 1000),
    pause: (ms: number) => {
      seconds += ms / 1000
    },
  }
}

// CDP resolves once the input is queued; pointer moves reach the page with the next frame.
export function touchscreen() {
  const time = clock()
  const touch = async (
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
    points: Point[]
  ) => {
    await cdp().send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map(toMainFrame),
      timestamp: time.tick(),
    })
    await nextFrame()
  }
  return {
    down: (point: Point) => touch('touchStart', [point]),
    move: (point: Point) => touch('touchMove', [point]),
    up: () => touch('touchEnd', []),
    cancel: () => touch('touchCancel', []),
    pause: time.pause,
  }
}

export function mouse() {
  const time = clock()
  const send = async (
    type: 'mousePressed' | 'mouseMoved' | 'mouseReleased',
    point: Point,
    pressed: boolean
  ) => {
    await cdp().send('Input.dispatchMouseEvent', {
      type,
      ...toMainFrame(point),
      button: pressed || type === 'mouseReleased' ? 'left' : 'none',
      buttons: pressed ? 1 : 0,
      clickCount: 1,
      timestamp: time.tick(),
    })
    await nextFrame()
  }
  let last: Point = { x: 0, y: 0 }
  return {
    async down(point: Point) {
      last = point
      await send('mousePressed', point, true)
    },
    async move(point: Point) {
      last = point
      await send('mouseMoved', point, true)
    },
    up: () => send('mouseReleased', last, false),
    async hover(point: Point) {
      last = point
      await send('mouseMoved', point, false)
    },
    pause: time.pause,
  }
}

export function pointIn(element: Element, offset: Point): Point {
  const box = element.getBoundingClientRect()
  return { x: box.left + offset.x, y: box.top + offset.y }
}
