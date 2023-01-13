import React from 'react'
import { useScroll } from 'use-scroll'

export default function Carousel() {
  const { ref, state, scrollLeft, scrollRight } = useScroll<any>({
    easingOption: 'ease-in-out',
  })
  const { isScrolledLeft, isScrolledRight } = state
  return (
    <>
      <button
        disabled={isScrolledLeft}
        className="absolute font-bold flex justify-center items-center w-10 h-10 left-10 z-10 text-indigo-900 bg-white rounded-full"
        onClick={() => scrollLeft()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        disabled={isScrolledRight}
        className="absolute font-bold w-10 h-10 flex justify-center items-center right-10 z-10 text-indigo-900 bg-white rounded-full"
        onClick={() => scrollRight()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
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
