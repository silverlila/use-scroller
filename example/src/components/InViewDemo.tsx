import { useRef } from 'react'
import { useInView } from 'use-scroller'
import { DESTINATIONS } from '../data'

export function InViewDemo() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {DESTINATIONS.slice(0, 6).map((place) => (
        <FadeInCard key={place.city} title={place.city} gradient={place.gradient} />
      ))}
    </div>
  )
}

function FadeInCard({ title, gradient }: { title: string; gradient: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { inView } = useInView(ref, { threshold: 0.3, once: true })

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        inView ? 'opacity-100' : 'opacity-0 motion-safe:translate-y-6'
      }`}
    >
      <div className={`aspect-[4/3] rounded-xl bg-linear-to-br ${gradient}`} />
      <p className="mt-2 font-medium text-gray-900">{title}</p>
    </div>
  )
}
