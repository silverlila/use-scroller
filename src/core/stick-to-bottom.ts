import { animateScroll, type AnimateScrollOptions, type ScrollHandle } from './animate-scroll'
import { readScroll, writeScroll } from './geometry'
import { observeScroll } from './observe-scroll'

export interface StickToBottom {
  scrollToBottom(options?: AnimateScrollOptions): ScrollHandle
  stop(): void
}

interface Sample {
  y: number
  maxY: number
}

const STICK_THRESHOLD = 8

export function stickToBottom(
  element: HTMLElement,
  onChange?: (isAtBottom: boolean) => void
): StickToBottom {
  let stuck = true
  let stopped = false
  let ownAnimation: ScrollHandle | null = null
  let previous = jumpToBottom(element)

  function setStuck(next: boolean) {
    if (next === stuck) return
    stuck = next
    onChange?.(stuck)
  }

  onChange?.(stuck)
  const unobserve = observeScroll(element, (current) => {
    const nextStuck = stuckAfter(stuck, previous, current)
    // A running scrollToBottom re-clamps to the growing bottom every frame; jumping would fight it.
    const follow = nextStuck && !ownAnimation && grewWithoutMovingUp(previous, current)
    previous = follow ? jumpToBottom(element) : { y: current.y, maxY: current.maxY }
    setStuck(nextStuck)
  })

  return {
    scrollToBottom(options) {
      if (stopped) throw new Error('stickToBottom: scrollToBottom called after stop()')
      const handle = animateScroll(element, { y: Infinity }, options)
      ownAnimation = handle
      setStuck(true)
      void handle.finished.then((result) => {
        if (ownAnimation !== handle) return
        ownAnimation = null
        if (result !== 'completed') setStuck(isNearBottom(readScroll(element)))
      })
      return handle
    },
    stop() {
      stopped = true
      const animation = ownAnimation
      ownAnimation = null
      animation?.cancel()
      unobserve()
    },
  }
}

// Reads back what the browser applied, so the next sample compares against the real position and
// our own write can never look like the user moving.
function jumpToBottom(element: HTMLElement): Sample {
  writeScroll(element, { y: readScroll(element).maxY })
  const { y, maxY } = readScroll(element)
  return { y, maxY }
}

function isNearBottom({ y, maxY }: Sample): boolean {
  return maxY - y <= STICK_THRESHOLD
}

function stuckAfter(stuck: boolean, previous: Sample, current: Sample): boolean {
  if (isNearBottom(current)) return true
  if (current.y < previous.y) return false
  return stuck
}

// A user flinging up while content streams in moves y down in the same sample the bottom grows;
// skipping that jump lets the next sample see them leave the threshold.
function grewWithoutMovingUp(previous: Sample, current: Sample): boolean {
  return current.maxY > previous.maxY && current.y >= previous.y
}
