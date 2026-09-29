interface Point {
  x: number
  y: number
}

export function dispatchTouch(type: string, target: Element, points: Point[]): TouchEvent {
  const touches = points.map(
    (point, identifier) => new Touch({ identifier, target, clientX: point.x, clientY: point.y })
  )
  const event = new TouchEvent(type, { touches, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

export function swipe(target: Element, finger: { dx?: number; dy?: number }): TouchEvent {
  const start = { x: 100, y: 100 }
  dispatchTouch('touchstart', target, [start])
  return dispatchTouch('touchmove', target, [
    { x: start.x + (finger.dx ?? 0), y: start.y + (finger.dy ?? 0) },
  ])
}
