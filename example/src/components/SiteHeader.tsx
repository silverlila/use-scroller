import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useScroll, useScrollSpy } from 'use-scroller'

interface Section {
  id: string
  label: string
}

const GAP_BELOW_HEADER = 16

export function SiteHeader({ sections }: { sections: Section[] }) {
  const header = useRef<HTMLElement>(null)
  const offset = useHeight(header) + GAP_BELOW_HEADER
  const active = useScrollSpy(
    sections.map((section) => section.id),
    { offset }
  )
  const page = useScroll('window')
  const nav = useRef<HTMLElement>(null)
  const { scrollToElement } = useScroll(nav)

  useEffect(() => {
    const link = nav.current?.querySelector<HTMLElement>('[aria-current="true"]')
    if (link) scrollToElement(link, { align: 'nearest' })
  }, [active, nav, scrollToElement])

  function jumpTo(id: string) {
    const section = document.getElementById(id)
    if (section) page.scrollToElement(section, { offset })
  }

  return (
    <header ref={header} className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pt-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-3">
        <a
          href="#top"
          className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
        >
          use-scroller
        </a>
        <nav
          ref={nav}
          aria-label="Demos"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 sm:pb-0"
        >
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              aria-current={index === active}
              onClick={() => jumpTo(section.id)}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-gray-600 transition-colors hover:text-gray-900 aria-[current=true]:bg-indigo-50 aria-[current=true]:text-indigo-700"
            >
              {section.label}
            </button>
          ))}
        </nav>
        <a
          href="https://github.com/silvi97lila/use-scroller"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-900 sm:ml-auto sm:block"
        >
          GitHub
        </a>
      </div>
    </header>
  )
}

function useHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return height
}
