import React from 'react'
import { useScroll } from 'use-scroller'

export default function Carousel() {
  const { ref, state, scrollLeft, scrollRight } = useScroll<HTMLDivElement>({
    duration: 800,
  })
  const { isScrolledLeft, isScrolledRight } = state
  return (
    <>
      <button
        disabled={isScrolledLeft}
        className="absolute font-bold flex justify-center items-center w-10 h-10 left-10 z-10 text-indigo-900 bg-white rounded-full"
        onClick={() => scrollLeft()}
      >
        prev
      </button>
      <button
        disabled={isScrolledRight}
        className="absolute font-bold w-10 h-10 flex justify-center items-center right-10 z-10 text-indigo-900 bg-white rounded-full"
        onClick={() => scrollRight()}
      >
        next
      </button>
      <div ref={ref} className="relative flex w-full h-full overflow-auto flex-nowrap">
        {Array(10)
          .fill(undefined)
          .map((_, key) => (
            <div key={key} className="w-full flex-none h-full bg-indigo-200">
              <div className="flex h-full text-8xl font-bold items-center text-indigo-500 justify-center">
                {key}
              </div>
            </div>
          ))}
      </div>
    </>
  )
}
