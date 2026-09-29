---
'use-scroller': major
---

v2 is a rewrite focused on real browser scrolling problems, especially on mobile. Native scrolling
stays in charge and the library steps in only where the platform falls short. The API is new; see
the migration table in the README.

- New framework-free entry `use-scroller/core`; `use-scroller` adds React hooks on top. React is now an optional peer dependency (18 or 19). ESM and CommonJS builds.
- `dragScroll` / `useDragScroll`: axis-locked swipe tracks with momentum and scroll-snap support.
- `lockScroll` / `useScrollLock`: reference-counted page scroll lock with scrollable allow-listed elements and a touch guard designed for iOS Safari.
- `animateScroll`, `scrollToEdge`, `scrollToElement`, `scrollBy`: tween, spring or instant; interrupted by user input; pauses scroll snapping while running; respects reduced motion.
- `observeScroll` / `useScrollState`: edges, progress, direction, velocity and `isScrolling`, correct in RTL, with selectors to limit re-renders.
- `observeActiveSection` / `useScrollSpy` and `useInView`.
- Breaking: `useScroll` no longer returns `state` (use `useScrollState`); animation options are objects (`{ type: 'tween' | 'spring' | 'instant' }`); `direction` is gone, each call names its axis; the `native` and `momentum` animations and the exported animation engine are removed; actions throw when their ref isn't attached.
