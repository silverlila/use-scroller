import { useScroll } from 'use-scroller'

export default function VerticalScrollDemo() {
  const { ref, state, scrollTop, scrollBottom, scrollCenter } = useScroll({
    animation: 'easing',
    direction: 'vertical',
    duration: 1000,
    easing: 'ease-in-out',
  })

  const { isScrolledTop, isScrolledBottom } = state

  return (
    <section className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Vertical Scrolling</h2>
        <p className="text-gray-600">
          Navigate up and down with smooth animations. Perfect for page sections!
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => scrollTop()} disabled={isScrolledTop}>
          ↑ Top
        </button>
        <button onClick={scrollCenter}>● Center</button>
        <button onClick={() => scrollBottom()} disabled={isScrolledBottom}>
          ↓ Bottom
        </button>
      </div>

      <div
        ref={ref}
        className="w-full h-96 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-green-100 to-teal-100 rounded-lg p-6"
      >
        <div className="space-y-6">
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Section {i + 1}</h3>
                <p className="text-sm text-gray-500">
                  {i === 7
                    ? '🎯 This is the center item!'
                    : 'Scroll vertically to explore different sections.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
