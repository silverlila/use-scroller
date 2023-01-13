import { useScroll } from 'use-scroll'
import { Button } from './Button'

export default function Pannel() {
  const { ref, state, scrollLeft, scrollRight, scrollBottom, scrollTop, scrollCenter } =
    useScroll<any>()

  const { isScrolledLeft, isScrolledRight, isScrolledTop, isScrolledBottom } = state

  return (
    <>
      <h1 className="font-bold mb-10">Basic example</h1>
      <div className="flex gap-10">
        <div className="flex flex-col gap-5">
          <Button
            onClick={() => scrollCenter()}
            className="w-full block bg-indigo-400 px-4 rounded"
          >
            Center
          </Button>
          <Button
            disabled={isScrolledLeft}
            onClick={() => scrollLeft()}
            className="w-full block bg-indigo-400 px-4 rounded"
          >
            Left
          </Button>
          <Button
            disabled={isScrolledRight}
            onClick={() => scrollRight()}
            className="w-full block bg-indigo-400 px-4 rounded"
          >
            Right
          </Button>
          <Button
            disabled={isScrolledTop}
            onClick={() => scrollTop()}
            className="block w-full bg-indigo-400 px-4 rounded"
          >
            Top
          </Button>
          <Button
            disabled={isScrolledBottom}
            onClick={() => scrollBottom()}
            className="block w-full bg-indigo-400 px-4 rounded"
          >
            Bottom
          </Button>
        </div>
        <section
          ref={ref}
          id="scroll-container"
          className="w-[50%] h-[50vh]  p-10 bg-indigo-50 overflow-auto"
        >
          <div className="inner h-[100vh] w-[100vw]"></div>
        </section>
      </div>
    </>
  )
}
