---
'use-scroller': major
---

v2 is a rewrite focused on real browser scrolling problems, especially on mobile. Native scrolling
stays in charge and the library steps in only where the platform falls short. The API is new; see
the migration table in the README.

- New framework-free entry `use-scroller/core`; `use-scroller` adds React hooks on top. React is now an optional peer dependency (18 or 19); `react-dom` is no longer a peer dependency. ESM-only.
- `dragScroll` / `useDragScroll`: axis-locked swipe tracks with momentum and scroll-snap support.
- `lockScroll` / `useScrollLock`: reference-counted page scroll lock with scrollable allow-listed elements and a touch guard designed for iOS Safari.
- `animateScroll`, `scrollToEdge`, `scrollToElement`, `scrollBy`: tween, spring or instant; interrupted by user input; pauses scroll snapping while running; respects reduced motion.
- `observeScroll` / `useScrollState`: edges, progress, direction, velocity and `isScrolling`, correct in RTL, with selectors to limit re-renders.
- `observeActiveSection` / `useScrollSpy` and `useInView`.
- `restoreScroll` / `useScrollRestoration`: saves a scroll position under a key and restores it after a reload or navigation, waiting for late content and giving way to the user's own scrolling.
- `stickToBottom` / `useStickToBottom`: keeps a chat, log or streaming reply pinned to its newest line until the user scrolls up, with `isAtBottom` and `scrollToBottom()` for a "new messages" button.
- Breaking: the package is ESM-only. `useScroll(target, options?)` takes a ref or `'window'` and no longer returns a `ref` or `state` (use `useScrollState`); `useWindowScroll` is replaced by `useScroll('window')`; animation options are objects (`{ type: 'tween' | 'spring' | 'instant' }`); `direction` is gone, each call names its axis; the `native` and `momentum` animations and the exported animation engine are removed; actions throw when their ref isn't attached (`cancel()` does nothing).
