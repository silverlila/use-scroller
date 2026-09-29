# use-scroller

Scroll utilities for the web, with React hooks on top. Native scrolling stays in charge; the
library steps in only where the platform falls short.

## What it fixes

- **Swipe tracks that drift.** On a phone, a slightly diagonal swipe on a horizontal carousel can
  move the page, the carousel, or both. `dragScroll` decides once per gesture and sticks to one axis.
- **Modal scroll bleed on iOS.** `overflow: hidden` on the page doesn't stop iOS Safari from
  scrolling it behind a modal. `lockScroll` adds a touch guard designed for iOS Safari (verify on a
  device) and keeps the modal's own list scrollable.
- **Animations that fight the user.** `animateScroll` stops the moment the user touches, wheels or
  presses a key, pauses CSS scroll snapping while it runs, and respects reduced motion.
- Also: scroll state (edges, progress, direction, velocity), scroll spy, in-view detection, scroll
  restoration, and sticking to the bottom of a chat or log.

## Install

```sh
npm install use-scroller
```

| Import              | Contains                              | Needs React |
| ------------------- | ------------------------------------- | ----------- |
| `use-scroller`      | React hooks plus everything from core | 18 or 19    |
| `use-scroller/core` | Framework-free functions              | No          |

React is an optional peer dependency, so the core entry works in any framework or none. Both
entries are ESM-only with types, and are safe to import during server rendering.

A scroll target is an `HTMLElement` or `window` (`ScrollTarget`). Every function that sets
something up returns a cleanup function.

## React hooks

### `useScroll`

`useScroll(target, options?)` gives animated scrolling for a ref or `'window'`. Hook options are
defaults; each call can override them.

```tsx
import { useRef } from 'react'
import { useScroll } from 'use-scroller'

function Feed() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollToEdge, scrollBy } = useScroll(ref, { animation: { type: 'spring' } })

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
const page = useScroll('window')
page.scrollToElement(sectionRef, { align: 'start', offset: 64 }) // 64px sticky header
```

Actions have stable identities, return a `ScrollHandle` (`{ finished, cancel() }`) and throw if the
ref isn't attached; `cancel()` returns nothing and does nothing then. A new animation on the same target cancels the previous one; unmounting cancels
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
mount and on the server every position is 0, every edge is reached and nothing can scroll.

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

### `useStickToBottom`

Keeps a chat, log or streaming reply pinned to its newest line.

```tsx
function Chat({ messages }: { messages: Message[] }) {
  const list = useRef<HTMLOListElement>(null)
  const { isAtBottom, scrollToBottom } = useStickToBottom(list)

  return (
    <div style={{ position: 'relative' }}>
      <ol ref={list} style={{ overflow: 'auto', height: 400 }}>
        {messages.map((message) => (
          <li key={message.id}>{message.text}</li>
        ))}
      </ol>
      {!isAtBottom && <button onClick={() => scrollToBottom()}>↓ New messages</button>}
    </div>
  )
}
```

It jumps to the bottom on mount. While at the bottom, it jumps to the new bottom whenever the
content grows or the element resizes: a new child, a child getting taller as a reply streams into it,
or text changing directly inside the element. The jump is instant so streamed text never lags
behind. Scrolling up more than 8px from the bottom stops the following; coming back within 8px
resumes it. `scrollToBottom(options?)` animates with the `animateScroll` options, follows again
right away, and returns a `ScrollHandle`. It throws if the ref isn't attached. The target must be
an element, not the window.

### `useScrollRestoration`

Saves a scroll position under a key and puts it back on the next mount: after a reload, or when
the user comes back to a route.

```tsx
const list = useRef<HTMLUListElement>(null)
useScrollRestoration(list, 'inbox')
useScrollRestoration('window', `page:${pathname}`) // pathname from your router, not `location`, so it renders on the server
```

Options are `storage` (default `sessionStorage`) and `timeout` (default 3000 ms); `restoreScroll`
below has the details. A new key or element starts over with that key's saved position.

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

### `restoreScroll`

```ts
const stop = restoreScroll(list, 'inbox', { storage: localStorage, timeout: 5000 })
```

- The position is stored as JSON under `use-scroller:<key>`. With the default `sessionStorage` it
  survives reloads and back/forward navigation in the same tab, but not a new tab.
- A saved position the content can already reach is written instantly. If the content isn't tall
  enough yet (data still loading), it waits for the content to grow and restores as soon as the
  position fits.
- Wheel, touch, pointer down or a key press on the target (the window, for a window target) during
  the wait cancels the restore. The user's own scrolling wins.
- After `timeout` ms it stops waiting and scrolls as close to the saved position as the content
  allows. A timeout outside 0–2147483647 ms throws a `RangeError`.
- Saving starts only once restoring has finished or been cancelled, so the initial position of 0
  never overwrites the saved one. From then on it saves on scroll (at most once per frame), on
  `pagehide`, and on cleanup.
- For `window`, it sets `history.scrollRestoration = 'manual'` while active, so the browser's own
  restore can't move the page after ours, and puts the previous value back on cleanup.
- If the storage is blocked or throws on read (privacy settings, sandboxed iframes), it does
  nothing: no restore, no saving, no error. A value under the key that isn't `{ x, y }` with finite
  numbers is ignored. A failed write (storage full) is skipped and the next scroll tries again.

### `stickToBottom`

```ts
const sticky = stickToBottom(log, (isAtBottom) => {
  newMessagesButton.hidden = isAtBottom
})
sticky.scrollToBottom({ animation: { type: 'spring' } })
sticky.stop()
```

`onChange` is called once on attach, then only when the state changes. `scrollToBottom` throws after
`stop()`. Behavior is the same as `useStickToBottom` above.

### `dragScroll`, `lockScroll`

```ts
const stopDrag = dragScroll(track, { axis: 'x', mouse: false })
const unlock = lockScroll({ allow: [modalList] })
```

The hooks above are thin wrappers around these.

### `observeActiveSection`

```ts
const stop = observeActiveSection(sections, (index) => highlight(index), {
  root: window,
  offset: 64,
})
```

### Low-level helpers

```ts
readScroll(target) // { x, y, minX, maxX, maxY, viewportWidth, viewportHeight }
isScrollable(element, 'y')
findScrollParent(element, 'y') // nearest scrollable ancestor, or window
```

## Recipes

### Infinite scroll

Load the next page when a sentinel after the last item comes within 800px of the viewport.

```tsx
function Feed() {
  const { items, hasMore, loading, loadMore } = useFeed()
  const sentinel = useRef<HTMLDivElement>(null)
  const { inView } = useInView(sentinel, { rootMargin: '0px 0px 800px 0px' })

  useEffect(() => {
    if (inView && hasMore && !loading) loadMore()
  }, [inView, hasMore, loading, loadMore])

  return (
    <>
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
      {hasMore && <div ref={sentinel} />}
    </>
  )
}
```

`loading` is a dependency, so the effect runs again after each page. If a short page leaves the
sentinel in view, the next one loads without waiting for another scroll. Inside a scroll container,
also pass `root: listRef`.

### Hide the header while scrolling down

```tsx
function Header() {
  const hidden = useScrollState('window', (s) => s.directionY === 1 && s.y > 64)
  return <header className={hidden ? 'header header--hidden' : 'header'}>…</header>
}
```

`directionY` keeps its last value when scrolling stops, so the header stays hidden until the user
scrolls up. The selector returns a boolean, so the header re-renders only when it flips. For a
scroll container, pass its ref instead of `'window'`.

### Load older messages without a jump

No JavaScript is needed to keep the view still when older messages are inserted above it. Scroll
anchoring (`overflow-anchor: auto`, the default) keeps the visible messages in place. Anchoring does
nothing at scroll position 0, so start loading before the user reaches the top:

```tsx
const list = useRef<HTMLOListElement>(null)
const firstMessage = useRef<HTMLLIElement>(null)
const { inView } = useInView(firstMessage, { root: list, rootMargin: '600px 0px 0px 0px' })
```

Scroll anchoring is on by default in Chromium and Firefox. Safari went without it for a long time,
so check the versions you support. Where it's missing, read `scrollHeight - scrollTop` before the
insert and set `scrollTop` back from it in a layout effect after.

## CSS first

Several scroll problems need no JavaScript. Reach for these before the library.

| Problem                                               | CSS                                                          | When you still need use-scroller                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| A nested list scrolls the page when it hits its end   | `overscroll-behavior: contain` on the list                   | The page must not move at all behind a modal on iOS, including when touching the backdrop: `lockScroll` |
| Diagonal swipes on a carousel move the page           | `touch-action: pan-x pinch-zoom` on the track                | You also want vertical swipes on the track to scroll the page: `dragScroll`                             |
| Carousel should stop on cards                         | `scroll-snap-type: x mandatory` + `scroll-snap-align: start` | Only when you also need axis locking or mouse dragging; `dragScroll` lands on the same snap points      |
| Layout jumps when content starts or stops overflowing | `scrollbar-gutter: stable` on the scroll container           | Never for this                                                                                          |
| Anchor links hide under a sticky header               | `scroll-margin-top` on the targets                           | You need to control duration or easing, or stop when the user scrolls: `scrollToElement` with `offset`  |

## Known limitations

- Scroll spy highlights the last section once the root is scrolled to the end, even if a short last
  section never reached the reading line.
- Hooks that take a ref pick up its element on the commit that attaches it. An element attached in a
  later commit that doesn't re-render the hook's component goes unnoticed until that component renders.
- `dragScroll` assumes `writing-mode: horizontal-tb`.
- Release momentum after a drag ignores `prefers-reduced-motion`, as native momentum does.
  Programmatic scrolls (`animateScroll` and everything built on it) respect it.
- `stickToBottom` watches the element and its direct children. Growth that doesn't resize either
  (for example an absolutely positioned grandchild) isn't followed.
- `restoreScroll` saves one position per key, not per history entry. Two history entries that
  share a key share a position, so put the route or item id in the key.
- `restoreScroll` on the window and a router's own scroll restoration both move the page. Use one.

## Browser support

Automated tests run in headless Chromium. These still need verification on real iOS Safari and
Android devices:

- the gesture features: `dragScroll` and the iOS part of `lockScroll`;
- `restoreScroll` saving on `pagehide` in iOS Safari, and pages coming back from the back/forward
  cache (the page returns as it was, so nothing should need restoring);
- `stickToBottom` when content grows during iOS momentum scrolling or the rubber-band bounce at the
  bottom.

## Migrating from v1

v2 is a rewrite. Animation options are objects, scroll state moved to its own hook, every action
names its axis, and the package is ESM-only.

| v1                                                                       | v2                                                                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `const { ref } = useScroll()`                                            | `const ref = useRef(null)`, then `useScroll(ref)`                                                             |
| `useScroll({ animation: 'easing', easing: 'ease-out', duration: 300 })`  | `useScroll(ref, { animation: { type: 'tween', duration: 300, easing: easings.easeOutCubic } })`               |
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
| `useWindowScroll()`                                                      | `useScroll('window')`                                                                                         |
| `useWindowScroll().state`                                                | `useScrollState('window')`                                                                                    |
| `useWindowScroll().scrollToTarget(el)`                                   | `useScroll('window').scrollToElement(el, { offset })`                                                         |
| `require('use-scroller')`                                                | `import` (ESM-only)                                                                                           |
| Actions do nothing while the ref is unattached                           | Actions throw (`cancel()` does nothing)                                                                       |
| `createEasingAnimation`, `createMomentumAnimation`                       | Removed. Use `animateScroll`                                                                                  |
| Types `ScrollOptions`, `EasingOptions`, `UseScrollReturn`                | `AnimateScrollOptions`, `ScrollAnimation`, `Easing`, `ScrollActions`, `ScrollState`                           |

## Demo site

[silverlila.github.io/use-scroller](https://silverlila.github.io/use-scroller/) walks through every
export with its code and a live demo. The source is in `site/`: run `yarn` at the root, then
`npm install && npm run dev` inside `site/`; the dev server listens on your LAN so you can open it on
a phone.

## License

MIT
