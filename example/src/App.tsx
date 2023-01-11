import Navigation from './components/Navigation'
import Pannel from './components/Pannel'

function App() {
  return (
    <div className="App bg-gray-50 h-full">
      <div className="container relative mx-auto p-10 ">
        <h1 className="text-center text-4xl font-semibold">use-scroll</h1>
        <hr className="my-10" />
        <Pannel />
        <hr className="my-20" />
        <Navigation />
        <hr className="my-20" />
        <section>
          <ul className="flex">
            <li>Element 1</li>
            <li>Element 2</li>
            <li>Element 3</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default App
