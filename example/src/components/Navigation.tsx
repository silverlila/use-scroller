import React from 'react'
import { useScroll } from 'use-scroll'
import { Button } from './Button'

export default function Navigation() {
  const { ref, state, scrollLeft, scrollRight } = useScroll<any>({})

  const { isScrolledLeft, isScrolledRight } = state

  return (
    <section>
      <h1 className="font-bold mb-10">Navigation</h1>
      <div className="navigation w-full flex gap-10 justify-between">
        <Button
          width={100}
          onClick={() => scrollLeft()}
          disabled={isScrolledLeft}
          className="block  bg-indigo-400 px-4 rounded "
        >
          Prev
        </Button>
        <div className="flex-1">
          <ul className="flex gap-5 w-[700px] overflow-x-auto" ref={ref}>
            {Array(30)
              .fill(0)
              .map((_, key) => (
                <li key={key} className="flex-1">
                  hello {key}
                </li>
              ))}
          </ul>
        </div>
        <Button
          onClick={() => scrollRight()}
          width={100}
          disabled={isScrolledRight}
          className="block bg-indigo-400 px-4 rounded 1"
        >
          Next
        </Button>
      </div>
    </section>
  )
}
