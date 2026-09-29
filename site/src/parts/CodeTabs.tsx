import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { CodeBlock } from '../CodeBlock'

export interface CodeTab {
  label: string
  file: string
  code: string
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [selected, setSelected] = useState(0)
  const id = useId()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const tab = tabs[selected]

  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (selected + step + tabs.length) % tabs.length
    setSelected(next)
    buttons.current[next]?.focus()
  }

  return (
    <div className="code-tabs">
      <div className="code-bar">
        {tabs.length > 1 ? (
          <div role="tablist" aria-label="Code example" className="tabs" onKeyDown={onKeyDown}>
            {tabs.map((item, index) => (
              <button
                key={item.label}
                ref={(element) => {
                  buttons.current[index] = element
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={index === selected}
                aria-controls={`${id}-panel`}
                tabIndex={index === selected ? 0 : -1}
                className="tab"
                onClick={() => setSelected(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="tab tab-static">{tab.label}</span>
        )}
        <span className="code-file">{tab.file}</span>
      </div>
      <div
        role={tabs.length > 1 ? 'tabpanel' : undefined}
        id={`${id}-panel`}
        aria-labelledby={tabs.length > 1 ? `${id}-tab-${selected}` : undefined}
      >
        <CodeBlock code={tab.code} />
      </div>
    </div>
  )
}
