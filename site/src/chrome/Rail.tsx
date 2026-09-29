import { useScrollSpy } from 'use-scroller'
import { useGoToSection } from '../hooks'
import { SECTION_IDS } from '../meta'
import { Index } from './Index'
import { Readout } from './Readout'

export function Rail({ spyOffset }: { spyOffset: number }) {
  return (
    <aside className="rail" aria-label="Drawing index and scroll readout">
      <div className="rail-inner">
        <nav aria-label="Sections">
          <p className="rail-head">Drawing index</p>
          <RailIndex spyOffset={spyOffset} />
        </nav>
        <Readout spyOffset={spyOffset} />
      </div>
    </aside>
  )
}

function RailIndex({ spyOffset }: { spyOffset: number }) {
  const active = useScrollSpy(SECTION_IDS, { offset: spyOffset })
  const goTo = useGoToSection()
  return <Index active={active} onSelect={goTo} />
}
