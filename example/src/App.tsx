import { useRef } from 'react'
import { useWindowScroll } from 'use-scroll'
import { Button } from './components/Button'
import Navigation from './components/Navigation'
import Pannel from './components/Pannel'

function App() {
  const { state, scrollToTarget } = useWindowScroll()
  const ref1 = useRef<HTMLDivElement>(null)
  const ref2 = useRef<HTMLDivElement>(null)
  const ref3 = useRef<HTMLDivElement>(null)
  console.log({ state })
  return (
    <div className="App bg-gray-50 h-full">
      <div className="container relative mx-auto p-10 ">
        <h1 className="text-center text-4xl font-semibold">use-scroll</h1>
        <hr className="my-10" />
        <Pannel />
        <hr className="my-20" />
        <Navigation />
        <hr className="my-20" />
        <section className="relative py-10">
          <ul className="flex absolute left-0 top-0">
            <li>
              <Button onClick={() => scrollToTarget(ref1.current as HTMLElement)}>Element 1</Button>
            </li>
            <li>
              <Button onClick={() => scrollToTarget(ref2.current as HTMLElement)}>Element 2</Button>
            </li>
            <li>
              <Button onClick={() => scrollToTarget(ref3.current as HTMLElement)}>Element 3</Button>
            </li>
          </ul>
        </section>
        <section>
          <div ref={ref1} className="element-1 w-full h-screen bg-indigo-300 mb-5"></div>
          <div ref={ref2} className="element-2 w-full h-screen bg-indigo-300 mb-5"></div>
          <div ref={ref3} className="element-3 w-full h-screen bg-indigo-300 mb-5"></div>
        </section>
      </div>
    </div>
  )
}

export default App
