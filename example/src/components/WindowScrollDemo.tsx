import { useWindowScroll } from 'use-scroller'
import { useRef } from 'react'

export default function WindowScrollDemo() {
  const { scrollToTarget, scrollTop } = useWindowScroll()
  const section1Ref = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLDivElement>(null)
  const section3Ref = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Window Scrolling</h2>
        <p className="text-gray-600">
          Smooth scroll to any section of your page with useWindowScroll hook.
        </p>
      </div>

      <div className="flex gap-3 mb-8 sticky top-20 bg-white p-4 rounded-lg shadow-md z-10">
        <button
          onClick={() => scrollTop()}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          ↑ Top
        </button>
        <button
          onClick={() => scrollToTarget(section1Ref.current as HTMLElement)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Section 1
        </button>
        <button
          onClick={() => scrollToTarget(section2Ref.current as HTMLElement)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Section 2
        </button>
        <button
          onClick={() => scrollToTarget(section3Ref.current as HTMLElement)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Section 3
        </button>
      </div>

      <div className="space-y-12">
        <div
          ref={section1Ref}
          className="h-96 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl p-12 text-white"
        >
          <h3 className="text-4xl font-bold mb-4">Section 1</h3>
          <p className="text-xl">
            This is the first section. The window will smoothly scroll here when you click the
            button above.
          </p>
        </div>

        <div
          ref={section2Ref}
          className="h-96 bg-gradient-to-br from-pink-400 to-rose-600 rounded-xl p-12 text-white"
        >
          <h3 className="text-4xl font-bold mb-4">Section 2</h3>
          <p className="text-xl">Navigate between sections effortlessly with smooth animations.</p>
        </div>

        <div
          ref={section3Ref}
          className="h-96 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl p-12 text-white"
        >
          <h3 className="text-4xl font-bold mb-4">Section 3</h3>
          <p className="text-xl">
            Perfect for landing pages, documentation, or any multi-section layout.
          </p>
        </div>
      </div>
    </div>
  )
}
