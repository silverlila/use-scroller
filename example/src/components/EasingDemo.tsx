import { useState } from 'react'
import { useScroll } from 'use-scroller'

type EasingOption = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export default function EasingDemo() {
  const [easing, setEasing] = useState<EasingOption>('ease-out')
  const { ref, scrollCenter, scrollRight, scrollLeft } = useScroll({
    animation: 'easing',
    direction: 'horizontal',
    duration: 1000,
    easing: easing,
  })

  const easingOptions: { value: EasingOption; label: string; description: string }[] = [
    { value: 'linear', label: 'Linear', description: 'Constant speed' },
    { value: 'ease-in', label: 'Ease In', description: 'Starts slow, ends fast' },
    { value: 'ease-out', label: 'Ease Out', description: 'Starts fast, ends slow' },
    { value: 'ease-in-out', label: 'Ease In-Out', description: 'Smooth S-curve' },
  ]

  return (
    <section className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Easing Functions</h2>
        <p className="text-gray-600">
          Compare different easing curves. Click "Scroll to Center" to see how each easing feels!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {easingOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setEasing(option.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              easing === option.value
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
          >
            <div className="font-semibold text-gray-800">{option.label}</div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 space-x-1">
        <button className="border rounded-xl px-2" onClick={() => scrollLeft()}>
          📍 Scroll left
        </button>
        <button className="border rounded-xl px-2" onClick={() => scrollCenter()}>
          📍 Scroll to Center
        </button>
        <button className="border rounded-xl px-2" onClick={() => scrollRight()}>
          📍 Scroll Right
        </button>
      </div>

      <div
        ref={ref}
        className="w-full h-64 overflow-x-auto overflow-y-hidden bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg"
      >
        <div className="flex gap-4 p-4 w-max">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className={`w-32 h-56 flex-shrink-0 rounded-lg shadow-md flex items-center justify-center text-3xl font-bold ${
                i === 14
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                  : 'bg-white text-gray-400'
              }`}
            >
              {i === 14 ? '🎯' : i + 1}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
