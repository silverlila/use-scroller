---
'use-scroller': minor
---

- New `readSnapPositions(container, axis)` export (from `use-scroller` and `use-scroller/core`): returns the CSS scroll-snap positions a container can rest at, in ascending order, so you can tell where it will snap.
- `dragScroll` / `useDragScroll` now respect `scroll-snap-stop: always`: a quick release no longer flings past a snap position whose snap area has it, matching native scrolling. Positions with `scroll-snap-stop: normal` can still be skipped.
