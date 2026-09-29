import type { ComponentType } from 'react'
import { InViewDemo } from './components/InViewDemo'
import { NestedScrollDemo } from './components/NestedScrollDemo'
import { ProgrammaticDemo } from './components/ProgrammaticDemo'
import { ScrollLockDemo } from './components/ScrollLockDemo'
import { ScrollStateDemo } from './components/ScrollStateDemo'
import { SiteHeader } from './components/SiteHeader'
import { SwipeTrackDemo } from './components/SwipeTrackDemo'

interface Demo {
  id: string
  label: string
  title: string
  description: string
  tryThis: string
  Component: ComponentType
}

const DEMOS: Demo[] = [
  {
    id: 'swipe-track',
    label: 'Swipe track',
    title: 'Swipe tracks that stay on their axis',
    description:
      'A horizontal carousel inside a vertical page. Natively, a slightly diagonal swipe can move the page, the track, or both. useDragScroll decides once per gesture and sticks to it.',
    tryThis: 'On a phone, swipe each track sideways at a slight angle.',
    Component: SwipeTrackDemo,
  },
  {
    id: 'nested-scroll',
    label: 'Nested scroll',
    title: 'Nested scrollers that stay put',
    description:
      'Natively, scrolling past the end of an inner list can start scrolling the page. With overscroll-behavior: contain, a scroll that starts in the list stays in the list; start outside it to scroll the page. No JavaScript needed.',
    tryThis: 'Scroll a list to its end, then keep scrolling in a new gesture.',
    Component: NestedScrollDemo,
  },
  {
    id: 'scroll-lock',
    label: 'Scroll lock',
    title: 'Modal scroll lock',
    description:
      'useScrollLock freezes the page behind a modal while the list inside it still scrolls and never chains to the page. Its touch guard is designed for iOS Safari; verify on a device.',
    tryThis: 'Open the inbox and scroll past the end of its list.',
    Component: ScrollLockDemo,
  },
  {
    id: 'programmatic',
    label: 'Programmatic',
    title: 'Programmatic scrolling',
    description:
      'Tween or spring animations to an edge, an element or by an offset. A running animation stops the moment the user touches, wheels or presses a key.',
    tryThis: 'Start the slow scroll, then grab the list.',
    Component: ProgrammaticDemo,
  },
  {
    id: 'scroll-state',
    label: 'Scroll state',
    title: 'Scroll state',
    description:
      'useScrollState with selectors: the progress bar re-renders on every scroll, the buttons only when an edge is reached or left.',
    tryThis: 'Scroll the row and watch the buttons disable at each end.',
    Component: ScrollStateDemo,
  },
  {
    id: 'in-view',
    label: 'In view',
    title: 'Reveal on scroll',
    description:
      'useInView with once: true. Cards fade in the first time they enter the viewport and stay visible.',
    tryThis: 'Scroll down to reveal the cards.',
    Component: InViewDemo,
  },
]

export default function App() {
  return (
    <div id="top" className="min-h-screen w-full bg-linear-to-br from-gray-50 to-gray-100">
      <SiteHeader sections={DEMOS} />

      <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <h1 className="text-4xl font-bold text-balance text-gray-900 sm:text-5xl">
          Scrolling that behaves on phones
        </h1>
        <p className="mt-4 text-lg text-pretty text-gray-600">
          Native scrolling stays in charge; use-scroller steps in where the platform falls short.
          The first three demos are about touch, so open this page on a phone.
        </p>
      </section>

      <main className="mx-auto max-w-7xl space-y-10 px-4 pb-20 sm:space-y-16 sm:px-6">
        {DEMOS.map(({ id, title, description, tryThis, Component }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className="rounded-2xl bg-white p-5 shadow-xl sm:p-10"
          >
            <h2 id={`${id}-title`} className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
            <p className="mt-2 max-w-[65ch] text-gray-600">{description}</p>
            <p className="mt-3 text-sm font-medium text-indigo-700">Try it: {tryThis}</p>
            <div className="mt-6">
              <Component />
            </div>
          </section>
        ))}
      </main>

      <footer className="bg-gray-900 py-10 text-center text-sm text-gray-400">
        <a
          href="https://github.com/silvi97lila/use-scroller"
          className="transition-colors hover:text-white"
        >
          use-scroller on GitHub
        </a>
      </footer>
    </div>
  )
}
