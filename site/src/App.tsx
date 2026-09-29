import { useScrollRestoration } from 'use-scroller'
import { Rail } from './chrome/Rail'
import { Ruler } from './chrome/Ruler'
import { Strip } from './chrome/Strip'
import { TitleBar } from './chrome/TitleBar'
import { spyOffset, useWide } from './hooks'
import { ChatSection } from './sections/ChatSection'
import { Concepts } from './sections/Concepts'
import { DragSection } from './sections/DragSection'
import { Footer } from './sections/Footer'
import { GeometrySection } from './sections/GeometrySection'
import { Hero } from './sections/Hero'
import { InViewSection } from './sections/InViewSection'
import { LockSection } from './sections/LockSection'
import { MotionSection } from './sections/MotionSection'
import { RestoreSection } from './sections/RestoreSection'
import { ScrollSection } from './sections/ScrollSection'
import { SpySection } from './sections/SpySection'
import { StateSection } from './sections/StateSection'

export function App() {
  const wide = useWide()
  return (
    <>
      <a className="skip" href="#concepts">
        Skip to the first sheet
      </a>
      <PageRestoration />
      {wide ? <Ruler /> : <Strip spyOffset={spyOffset(false)} />}
      <div className="page">
        <TitleBar />
        <div className="layout">
          <main className="main">
            <Hero />
            <Concepts />
            <ScrollSection />
            <MotionSection />
            <StateSection />
            <ChatSection />
            <DragSection />
            <LockSection />
            <SpySection />
            <InViewSection />
            <RestoreSection />
            <GeometrySection />
          </main>
          {wide && <Rail spyOffset={spyOffset(true)} />}
        </div>
        <Footer />
      </div>
    </>
  )
}

function PageRestoration() {
  useScrollRestoration('window', 'blueprint:page')
  return null
}
