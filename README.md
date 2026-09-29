# use-scroller

Scroll utilities for the web, with React hooks on top. Native scrolling stays in charge; the
library steps in only where the platform falls short.

## What it fixes

- **Swipe tracks that drift.** On a phone, a slightly diagonal swipe on a horizontal carousel can
  move the page, the carousel, or both. `dragScroll` decides once per gesture and sticks to one axis.
- **Nested scrollers that get stuck.** When an inner list hits its end mid-gesture, the browser keeps
  the gesture latched to the list and the rest of the swipe is lost. `scrollHandoff` passes the
  remainder to the parent.
- **Modal scroll bleed on iOS.** `overflow: hidden` on the page doesn't stop iOS Safari from
  scrolling it behind a modal. `lockScroll` adds a touch guard designed for iOS Safari (verify on a
  device) and keeps the modal's own list scrollable.
- **Animations that fight the user.** `animateScroll` stops the moment the user touches, wheels or
  presses a key, pauses CSS scroll snapping while it runs, and respects reduced motion.
- Also: scroll state (edges, progress, direction, velocity), scroll spy, and in-view detection.

## Install

```sh
npm install use-scroller
```

| Import              | Contains                              | Needs React |
| ------------------- | ------------------------------------- | ----------- |
| `use-scroller`      | React hooks plus everything from core | 18 or 19    |
| `use-scroller/core` | Framework-free functions              | No          |

React is an optional peer dependency, so the core entry works in any framework or none. Both
entries ship ESM, CommonJS and types, and are safe to import during server rendering.

A scroll target is an `HTMLElement` or `window` (`ScrollTarget`). Every function that sets
something up returns a cleanup function.

## React hooks

### `useScroll`, `useWindowScroll`

Animated scrolling for an element (through the returned `ref`) or the window. Hook options are
defaults; each call can override them.

```tsx
import { useScroll } from 'use-scroller'

function Feed() {
  const { ref, scrollToEdge, scrollBy } = useScroll<HTMLDivElement>({
    animation: { type: 'spring' },
  })

  async function toBottom() {
    const result = await scrollToEdge('bottom').finished // 'completed' | 'interrupted' | 'cancelled'
    if (result === 'interrupted') showToast('Stopped where you grabbed it')
  }

  return (
    <>
      <button onClick={toBottom}>Latest</button>
      <button onClick={() => scrollBy({ y: 300 })}>More</button>
      <div ref={ref} style={{ overflow: 'auto', height: 300 }}>
        …
      </div>
    </>
  )
}
```

The other actions are `scrollTo({ x, y })`, `scrollToElement(elementOrRef, { align, offset })` and
`cancel()`.

```ts
const page = useWindowScroll()
page.scrollToElement(sectionRef, { align: 'start', offset: 64 }) // 64px sticky header
```

Actions have stable identities, return a `ScrollHandle` (`{ finished, cancel() }`) and throw if the
ref isn't attached. A new animation on the same target cancels the previous one; unmounting cancels
a running one.

### `useScrollState`

Live scroll state for a ref or `'window'`. Pass a selector to re-render only when that value changes.

```tsx
const state = useScrollState(ref)
const atEnd = useScrollState(ref, (s) => s.atRight)
const progress = useScrollState('window', (s) => s.progressY)
```

`ScrollState` fields: `x`, `y`, `minX`, `maxX`, `maxY`, `progressX`, `progressY` (0–1), `atTop`,
`atBottom`, `atLeft`, `atRight`, `canScrollX`, `canScrollY`, `directionX`, `directionY` (−1, 0, 1),
`velocityX`, `velocityY` (px/s) and `isScrolling`. Edges and progress are correct in RTL. Before
mount and on the server it returns `initialScrollState`.

### `useDragScroll`

Axis-locked swiping for a horizontal (or vertical) track.

```tsx
const track = useRef<HTMLUListElement>(null)
useDragScroll(track, { axis: 'x', mouse: true })
```

It sets `touch-action: pan-y pinch-zoom` on the track (`pan-x pinch-zoom` for `axis: 'y'`), so
cross-axis movement scrolls the page natively and pinch-zoom keeps working. A gesture
is judged after 8px: mostly sideways and the track follows the finger, otherwise it is left to the
browser. Release continues with momentum and lands on a CSS scroll-snap position if the track has
any. A drag doesn't fire a click on whatever is under the finger. Wheel, trackpad, keyboard and the scrollbar stay
native. `mouse: true` also lets a mouse drag the track.

### `useScrollHandoff`

Lets a nested scroller hand the rest of a gesture to its parent at its edge.

```tsx
const list = useRef<HTMLUListElement>(null)
useScrollHandoff(list) // { axis: 'y', parent: nearest scrollable ancestor or window }
```

Works for wheel and touch. On release after a handoff the parent continues with momentum; reversing
direction winds the parent back before the list scrolls again.

### `useScrollLock`

Locks page scrolling while `active` is true. Elements in `allow` stay scrollable and never chain to
the page.

```tsx
const [open, setOpen] = useState(false)
const list = useRef<HTMLUListElement>(null)
useScrollLock(open, { allow: [list] })
```

Locks are reference-counted, so nested modals work. The scrollbar's width is added as body padding
so the layout doesn't shift, and the page's scroll position is kept.

### `useScrollSpy`

Returns the index of the section at the reading line, or −1 before the first one. Sections are refs
or element ids.

```tsx
const active = useScrollSpy(['intro', 'install', apiRef], { offset: 64 })
```

`offset` moves the reading line down from the root's top edge, usually by a sticky header's height.
`root` is a ref to a scroll container (default: the window). A missing id throws.

### `useInView`

```tsx
const ref = useRef<HTMLDivElement>(null)
const { inView, entry } = useInView(ref, { threshold: 0.3, once: true })
```

Also takes `root` and `rootMargin`, like `IntersectionObserver`. With `once`, `inView` stays true
after the first intersection.

## Core functions

Everything below is exported from both entries.

### `animateScroll`

```ts
import { animateScroll, easings, cubicBezier } from 'use-scroller/core'

const handle = animateScroll(
  window,
  { y: 800 },
  {
    animation: { type: 'tween', duration: 300, easing: easings.easeInOutCubic },
  }
)
await handle.finished
```

| Option                 | Default             | Notes                                                                                                                         |
| ---------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `animation`            | `{ type: 'tween' }` | `tween` (`duration` 450, `easing` easeOutCubic), `spring` (`stiffness` 170, `damping` 26, `mass` 1, `velocity`), or `instant` |
| `interruptible`        | `true`              | wheel, touchstart, pointerdown or keydown on the target stops it with `'interrupted'`                                         |
| `respectReducedMotion` | `true`              | jumps instantly when `prefers-reduced-motion: reduce` matches                                                                 |

A missing axis doesn't move. Targets are clamped to the scroll range every frame. `easings` has
`linear`, `easeInCubic`, `easeOutCubic` and `easeInOutCubic`; `cubicBezier(0.25, 0.1, 0.25, 1)` builds
any CSS curve.

### `scrollToEdge`, `scrollToElement`, `scrollBy`, `cancelScroll`

```ts
scrollToEdge(list, 'bottom') // 'top' | 'bottom' | 'left' | 'right'; left and right respect RTL
scrollToElement(window, heading, { align: 'center', offset: 64 }) // 'start' | 'center' | 'end' | 'nearest'
scrollBy(list, { y: 200 }) // repeated calls add up while an animation is running
cancelScroll(list)
```

All take the same options as `animateScroll` and return a `ScrollHandle`.

### `observeScroll`

```ts
const stop = observeScroll(list, (state) => console.log(state.progressY), { idleDelay: 120 })
```

Emits a `ScrollState` once on subscribe, then at most once per frame when something changed,
including when the content or container resizes. `isScrolling` turns false after `idleDelay` ms
without scroll events.

### `dragScroll`, `scrollHandoff`, `lockScroll`

```ts
const stopDrag = dragScroll(track, { axis: 'x', mouse: false })
const stopHandoff = scrollHandoff(list, { axis: 'y', parent: window })
const unlock = lockScroll({ allow: [modalList] })
```

The hooks above are thin wrappers around these.

### `observeActiveSection`, `pickActiveSection`

```ts
const stop = observeActiveSection(sections, (index) => highlight(index), {
  root: window,
  offset: 64,
})
pickActiveSection([-300, 40, 600], 64, false) // 1: the last section whose top is above the line
```

### Low-level helpers

```ts
readScroll(target) // { x, y, minX, maxX, maxY, viewportWidth, viewportHeight }
writeScroll(target, { y: 0 }) // instant, ignores CSS scroll-behavior
isScrollable(element, 'y')
findScrollParent(element, 'y') // nearest scrollable ancestor, or window
readSnapPositions(track, 'x') // scroll positions of the track's snap points
pickSnapTarget(positions, current, projected, velocity)
```

`EDGE_TOLERANCE` (1px) is the slack used for edge checks, since high-DPI screens produce fractional
positions that never hit an edge exactly.

## CSS first

Several scroll problems need no JavaScript. Reach for these before the library.

| Problem                                                       | CSS                                                          | When you still need use-scroller                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| A modal or sidebar list scrolls the page when it hits its end | `overscroll-behavior: contain` on the list                   | The page must not move at all behind a modal on iOS, including when touching the backdrop: `lockScroll` |
| Diagonal swipes on a carousel move the page                   | `touch-action: pan-x pinch-zoom` on the track                | You also want vertical swipes on the track to scroll the page: `dragScroll`                             |
| Carousel should stop on cards                                 | `scroll-snap-type: x mandatory` + `scroll-snap-align: start` | Only when you also need axis locking or mouse dragging; `dragScroll` lands on the same snap points      |
| Layout jumps when content starts or stops overflowing         | `scrollbar-gutter: stable` on the scroll container           | Never for this                                                                                          |
| Anchor links hide under a sticky header                       | `scroll-margin-top` on the targets                           | You need to control duration or easing, or stop when the user scrolls: `scrollToElement` with `offset`  |

## Known limitations

- `scrollHandoff` sets `overscroll-behavior: none` on the inner element along its axis. Native
  chaining past the one parent it drives is cut, so a gesture won't continue into a grandparent.
- `scrollHandoff` doesn't consider a same-axis scroller nested inside the inner element.
- Scroll spy highlights the last section once the root is scrolled to the end, even if a short last
  section never reached the reading line.
- Hooks that take a ref pick up its element on the commit that attaches it. An element attached in a
  later commit that doesn't re-render the hook's component goes unnoticed until that component renders.
- `dragScroll` assumes `writing-mode: horizontal-tb`.
- Release momentum after a drag or handoff ignores `prefers-reduced-motion`, as native momentum does.
  Programmatic scrolls (`animateScroll` and everything built on it) respect it.

## Browser support

Automated tests run in headless Chromium. The gesture features (`dragScroll`,
`scrollHandoff`, the iOS part of `lockScroll`) still need verification on real iOS Safari and
Android devices.

## Migrating from v1

v2 is a rewrite. Animation options are objects, scroll state moved to its own hook, and every
action names its axis.

| v1                                                                       | v2                                                                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `useScroll({ animation: 'easing', easing: 'ease-out', duration: 300 })`  | `useScroll({ animation: { type: 'tween', duration: 300, easing: easings.easeOutCubic } })`                    |
| `easing: 'linear' \| 'ease-in' \| 'ease-out' \| 'ease-in-out'`           | `easings.linear`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic` (cubic, not quadratic), or `cubicBezier(…)` |
| `animation: 'momentum'`, `friction`                                      | `animation: { type: 'spring', stiffness, damping, mass }`                                                     |
| `animation: 'native'`, `behavior`                                        | Removed. Use `element.scrollTo({ behavior: 'smooth' })`, or `{ type: 'instant' }`                             |
| `direction: 'horizontal' \| 'vertical'`                                  | Removed. Each call says which axis: `scrollTo({ x })`, `scrollTo({ y })`                                      |
| `respectMotionPreference`                                                | `respectReducedMotion` (default `true`)                                                                       |
| `const { state } = useScroll()`                                          | `useScrollState(ref)`                                                                                         |
| `state.left`, `state.top`                                                | `x`, `y`                                                                                                      |
| `isScrolledLeft`, `isScrolledRight`, `isScrolledTop`, `isScrolledBottom` | `atLeft`, `atRight`, `atTop`, `atBottom`                                                                      |
| `maxScrollLeft`, `maxScrollTop`                                          | `maxX` (and `minX` in RTL), `maxY`                                                                            |
| `scrollPercentageX`, `scrollPercentageY` (0–100)                         | `progressX`, `progressY` (0–1)                                                                                |
| `isScrollable`                                                           | `canScrollX`, `canScrollY`                                                                                    |
| `scrollLeft()`, `scrollRight()`, `scrollTop()`, `scrollBottom()`         | `scrollToEdge('left' \| 'right' \| 'top' \| 'bottom')`                                                        |
| `scrollLeft(n)`, `scrollTop(n)` (scroll to position `n`)                 | `scrollTo({ x: n })`, `scrollTo({ y: n })`                                                                    |
| `scrollTo(n)`                                                            | `scrollTo({ x: n })` or `scrollTo({ y: n })`                                                                  |
| `scrollCenter()`                                                         | `scrollTo({ y: readScroll(ref.current).maxY / 2 })`                                                           |
| `cancelScroll()`                                                         | `cancel()`                                                                                                    |
| `useWindowScroll().state`                                                | `useScrollState('window')`                                                                                    |
| `useWindowScroll().scrollToTarget(el)`                                   | `useWindowScroll().scrollToElement(el, { offset })`                                                           |
| Actions do nothing while the ref is unattached                           | Actions throw                                                                                                 |
| `createEasingAnimation`, `createMomentumAnimation`                       | Removed. Use `animateScroll`                                                                                  |
| Types `ScrollOptions`, `EasingOptions`, `UseScrollReturn`                | `AnimateScrollOptions`, `ScrollAnimation`, `Easing`, `ScrollActions`, `ScrollState`                           |

## Example app

`example/` has a demo of every feature, with native and enhanced versions side by side for the touch
ones. Run `npm install && npm run dev` inside it; the dev server listens on your LAN so you can open
it on a phone.

## License

MIT
