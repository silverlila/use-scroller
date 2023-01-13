import { useRef } from 'react'
import { useWindowScroll } from 'use-scroll'
import Carousel from './components/Carousel'
import Pannel from './components/Pannel'

function App() {
  const { scrollToTarget } = useWindowScroll()
  const defaultRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  return (
    <div className="App bg-gray-50 h-full overflow-hidden">
      <nav className="mx-auto flex justify-between  p-5 fixed bg-white w-full z-50">
        <h1 className="font-sans font-bold">use-scroll</h1>
        <ul className="flex justify-center divide-x">
          <li>
            <button
              className="font-normal text-gray-600 text-center px-5"
              onClick={() => scrollToTarget(defaultRef.current as HTMLElement)}
            >
              Default
            </button>
          </li>
          <li>
            <button
              className="font-normal text-gray-600 text-center px-5"
              onClick={() => scrollToTarget(navRef.current as HTMLElement)}
            >
              Navigation
            </button>
          </li>
          <li>
            <button
              className="font-normal text-gray-600 text-center px-5"
              onClick={() => scrollToTarget(carouselRef.current as HTMLElement)}
            >
              Carousel
            </button>
          </li>
        </ul>
        <h1>github</h1>
      </nav>
      <div className="container relative mx-auto overflow-hidden">
        <section className="divide-y">
          <div ref={defaultRef} className="py-10 h-screen flex items-center">
            <Pannel />
          </div>
          <div ref={navRef} className="py-10 h-screen flex items-center">
            <Pannel />
          </div>
          <div ref={carouselRef} className="py-10 h-screen flex items-center">
            <Carousel />
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
