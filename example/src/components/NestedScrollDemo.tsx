import { useRef, type Ref } from 'react'
import { useScrollHandoff } from 'use-scroller'
import { MESSAGES } from '../data'
import { Comparison, Panel } from './Panel'

export function NestedScrollDemo() {
  const enhanced = useRef<HTMLUListElement>(null)
  useScrollHandoff(enhanced)

  return (
    <Comparison>
      <Panel label="Native">
        <MessageList />
      </Panel>
      <Panel label="With useScrollHandoff" accent>
        <MessageList ref={enhanced} />
      </Panel>
    </Comparison>
  )
}

function MessageList({ ref }: { ref?: Ref<HTMLUListElement> }) {
  return (
    <ul
      ref={ref}
      className="h-80 divide-y divide-black/5 overflow-y-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5"
    >
      {MESSAGES.map((message) => (
        <li key={message.id} className="flex items-center gap-3 px-4 py-3">
          <div className={`size-10 shrink-0 rounded-full bg-linear-to-br ${message.avatar}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium text-gray-900">{message.name}</p>
              <p className="text-xs text-gray-400 tabular-nums">{message.time}</p>
            </div>
            <p className="truncate text-sm text-gray-500">{message.text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
