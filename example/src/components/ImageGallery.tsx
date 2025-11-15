import { useScroll } from 'use-scroller'

export default function ImageGallery() {
  const { ref, state, scrollLeft, scrollRight } = useScroll({
    animation: 'easing',
    direction: 'horizontal',
    duration: 800,
    easing: 'ease-out',
  })

  const { isScrolledLeft, isScrolledRight } = state

  const colors = [
    'from-red-400 to-pink-600',
    'from-purple-400 to-indigo-600',
    'from-blue-400 to-cyan-600',
    'from-green-400 to-emerald-600',
    'from-yellow-400 to-orange-600',
    'from-pink-400 to-rose-600',
    'from-indigo-400 to-purple-600',
    'from-cyan-400 to-blue-600',
  ]

  return (
    <section className="w-full relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Image Gallery</h2>
        <p className="text-gray-600">
          A beautiful carousel perfect for showcasing images or products.
        </p>
      </div>

      <div className="relative group">
        {/* Navigation Buttons */}
        <button
          onClick={() => scrollLeft?.()}
          disabled={isScrolledLeft}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
            isScrolledLeft
              ? 'opacity-0 cursor-not-allowed'
              : 'opacity-0 group-hover:opacity-100 hover:scale-110 hover:shadow-xl'
          }`}
        >
          <span className="text-2xl">←</span>
        </button>

        <button
          onClick={() => scrollRight?.()}
          disabled={isScrolledRight}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
            isScrolledRight
              ? 'opacity-0 cursor-not-allowed'
              : 'opacity-0 group-hover:opacity-100 hover:scale-110 hover:shadow-xl'
          }`}
        >
          <span className="text-2xl">→</span>
        </button>

        {/* Gallery */}
        <div
          ref={ref}
          className="w-full overflow-x-auto overflow-y-hidden rounded-lg hide-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex gap-6 p-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="w-96 h-80 flex-shrink-0 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div
                  className={`w-full h-full bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white`}
                >
                  <div className="text-center">
                    <div className="text-8xl mb-4">
                      {['🏔️', '🌅', '🏖️', '🌃', '🌲', '🌊', '🏜️', '🌌'][i]}
                    </div>
                    <div className="text-2xl font-bold">Image {i + 1}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
