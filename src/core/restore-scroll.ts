import { isWindow, writeScroll } from './geometry'
import { observeScroll } from './observe-scroll'
import { EDGE_TOLERANCE, type ScrollTarget } from './types'

export interface RestoreScrollOptions {
  storage?: Storage
  timeout?: number
}

interface Position {
  x: number
  y: number
}

interface Range {
  minX: number
  maxX: number
  maxY: number
}

const INTERACTION_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown']

// setTimeout treats longer delays as 0, which would give up on restoring immediately.
const MAX_TIMEOUT_MS = 2_147_483_647

const historyHolds = new Set<object>()
let originalHistoryRestoration: ScrollRestoration = 'auto'

export function restoreScroll(
  target: ScrollTarget,
  key: string,
  { storage, timeout = 3000 }: RestoreScrollOptions = {}
): () => void {
  if (!(timeout >= 0 && timeout <= MAX_TIMEOUT_MS)) {
    throw new RangeError(
      `restoreScroll: timeout must be between 0 and ${MAX_TIMEOUT_MS} ms, got ${timeout}`
    )
  }
  const storageKey = `use-scroller:${key}`
  let store: Storage
  let saved: Position | null
  // Storage throws when blocked (privacy settings, sandboxed iframes) or full. Restoring is a
  // nicety, so it gives up rather than breaking the page.
  try {
    store = storage ?? window.sessionStorage
    saved = parsePosition(store.getItem(storageKey))
  } catch {
    return noop
  }

  let unsavedPosition: Position | null = null
  let frame: number | null = null
  let saving = false

  function save() {
    frame = null
    const position = unsavedPosition
    unsavedPosition = null
    if (!position) return
    try {
      store.setItem(storageKey, JSON.stringify(position))
    } catch {
      // Full or revoked storage: the next scroll tries again.
    }
  }

  // The position is read at scroll time: by cleanup, the element may hold different content.
  function onScroll() {
    unsavedPosition = scrollPosition(target)
    if (frame === null) frame = requestAnimationFrame(save)
  }

  function flush() {
    if (frame !== null) cancelAnimationFrame(frame)
    save()
  }

  function startSaving() {
    saving = true
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', flush)
  }

  const releaseHistory = isWindow(target) ? takeOverHistoryRestoration(target.history) : noop
  const stopRestoring = saved ? restoreWhenReachable(target, saved, timeout, startSaving) : noop
  if (!saved) startSaving()

  return () => {
    stopRestoring()
    if (saving) {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', flush)
      flush()
    }
    releaseHistory()
  }
}

function restoreWhenReachable(
  target: ScrollTarget,
  position: Position,
  timeout: number,
  onSettled: () => void
): () => void {
  let waiting = true
  let stopObserving = noop
  const timer = setTimeout(() => {
    // The browser clamps the write to the closest reachable position.
    writeScroll(target, position)
    settle()
  }, timeout)

  function stop() {
    waiting = false
    stopObserving()
    clearTimeout(timer)
    for (const type of INTERACTION_EVENTS) target.removeEventListener(type, settle)
  }

  function settle() {
    stop()
    onSettled()
  }

  function restoreIfReachable(range: Range) {
    if (!waiting || !isReachable(range, position)) return
    writeScroll(target, position)
    settle()
  }

  for (const type of INTERACTION_EVENTS) {
    target.addEventListener(type, settle, { passive: true })
  }
  stopObserving = observeScroll(target, restoreIfReachable)
  // observeScroll reports synchronously, so an already reachable position settles before it returns.
  if (!waiting) stopObserving()
  return stop
}

function takeOverHistoryRestoration(history: History): () => void {
  const hold = {}
  if (historyHolds.size === 0) {
    originalHistoryRestoration = history.scrollRestoration
    // Otherwise the browser's own restore can land after ours and move the page again.
    history.scrollRestoration = 'manual'
  }
  historyHolds.add(hold)
  return () => {
    if (!historyHolds.delete(hold)) return
    if (historyHolds.size === 0) history.scrollRestoration = originalHistoryRestoration
  }
}

function isReachable(range: Range, position: Position): boolean {
  return (
    position.y <= range.maxY + EDGE_TOLERANCE &&
    position.x >= range.minX - EDGE_TOLERANCE &&
    position.x <= range.maxX + EDGE_TOLERANCE
  )
}

function scrollPosition(target: ScrollTarget): Position {
  if (isWindow(target)) return { x: target.scrollX, y: target.scrollY }
  return { x: target.scrollLeft, y: target.scrollTop }
}

function parsePosition(json: string | null): Position | null {
  if (json === null) return null
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return null
  }
  return isPosition(value) ? { x: value.x, y: value.y } : null
}

function isPosition(value: unknown): value is Position {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y)
  )
}

function noop() {
  // Nothing was started, so there is nothing to stop.
}
