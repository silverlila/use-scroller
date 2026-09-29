import { useRef, useState } from 'react'
import { useScrollLock } from 'use-scroller'
import { MESSAGES } from '../data'

export function ScrollLockDemo() {
  const dialog = useRef<HTMLDialogElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  useScrollLock(open, { allow: [list] })

  function openDialog() {
    dialog.current?.showModal()
    setOpen(true)
  }

  return (
    <div>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-[background-color,transform] hover:bg-indigo-700 active:scale-[0.96]"
      >
        Open inbox
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="inbox-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-gray-900/40"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h3 id="inbox-title" className="text-lg font-semibold text-gray-900">
            Inbox
          </h3>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <ul ref={list} className="h-[60dvh] max-h-96 divide-y divide-black/5 overflow-y-auto">
          {MESSAGES.map((message) => (
            <li key={message.id} className="px-5 py-3">
              <p className="font-medium text-gray-900">{message.name}</p>
              <p className="text-sm text-gray-500">{message.text}</p>
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  )
}
