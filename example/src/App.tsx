import MomentumDemo from './components/MomentumDemo'
import EasingDemo from './components/EasingDemo'
import VerticalScrollDemo from './components/VerticalScrollDemo'
import ImageGallery from './components/ImageGallery'
import WindowScrollDemo from './components/WindowScrollDemo'

function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                use-scroller
              </h1>
              <p className="text-gray-500 text-sm mt-1">Beautiful, smooth scrolling for React</p>
            </div>
            <a
              href="https://github.com/silvi97lila/use-scroller"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className=" max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Interactive Demos</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore different scrolling animations and see what use-scroller can do for your
            project.
          </p>
        </div>
      </section>

      {/* Demos */}
      <main className="max-w-7xl mx-auto px-6 pb-20 space-y-20">
        {/* Momentum Demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <MomentumDemo />
        </div>

        {/* Easing Demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <EasingDemo />
        </div>

        {/* Image Gallery */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <ImageGallery />
        </div>

        {/* Vertical Scroll Demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <VerticalScrollDemo />
        </div>

        {/* Window Scroll Demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <WindowScrollDemo />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">Made with ❤️ using use-scroller</p>
          <div className="mt-4 space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Documentation
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              npm
            </a>
            <a
              href="https://github.com/silvi97lila/use-scroller"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
