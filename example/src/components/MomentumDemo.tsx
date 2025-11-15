import { useScroll } from 'use-scroller'

export default function MomentumDemo() {
  const { ref, state, scrollLeft, scrollRight } = useScroll({
    animation: 'momentum',
    direction: 'horizontal',
    duration: 2000,
    friction: 0.92,
  })

  const { isScrolledLeft, isScrolledRight } = state

  return (
    <section className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Momentum Scrolling</h2>
        <p className="text-gray-600">
          Physics-based scrolling with decay. Try scrolling - it feels like sliding with friction!
        </p>
        <div className="mt-2 text-sm text-indigo-600">
          <code>momentum: true, friction: 0.92</code>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => scrollLeft?.()} disabled={isScrolledLeft}>
          ← Scroll Left
        </button>
        <button onClick={() => scrollRight?.()} disabled={isScrolledRight}>
          Scroll Right →
        </button>
      </div>

      <div
        ref={ref}
        className="w-full h-64 overflow-x-auto overflow-y-hidden bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg"
      >
        <div className="flex gap-4 p-4 w-max">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="w-48 h-56 flex-shrink-0 bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center"
            >
              <div className="text-6xl font-bold text-indigo-500 mb-2">{i + 1}</div>
              <div className="text-sm text-gray-500">Card {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
