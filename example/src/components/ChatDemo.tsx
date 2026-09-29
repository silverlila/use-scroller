import { useEffect, useRef, useState } from 'react'
import { useInView, useStickToBottom } from 'use-scroller'
import { MESSAGES, type Message } from '../data'

type ChatLine = { kind: 'message'; message: Message } | { kind: 'reply'; words: number }

const REPLY =
  'This reply streams in word by word and grows in place, the way an AI answer or a build log does. While you are at the bottom, the list follows every new word without lagging behind. Scroll up to read something earlier and it stays where you left it; New messages brings you back when you are ready.'
const REPLY_WORDS = REPLY.split(' ')
const MESSAGE_DELAY = 2000
const WORD_DELAY = 50
const REPLY_EVERY = 4
const INITIAL_LINES: ChatLine[] = MESSAGES.slice(0, 6).map((message) => ({
  kind: 'message',
  message,
}))

function appendNext(lines: ChatLine[]): ChatLine[] {
  const index = lines.length
  const next: ChatLine =
    index % REPLY_EVERY === REPLY_EVERY - 1
      ? { kind: 'reply', words: 0 }
      : { kind: 'message', message: MESSAGES[index % MESSAGES.length] }
  return [...lines, next]
}

function growReply(lines: ChatLine[]): ChatLine[] {
  const last = lines[lines.length - 1]
  if (last.kind !== 'reply') return lines
  return [...lines.slice(0, -1), { kind: 'reply', words: last.words + 1 }]
}

function isStreaming(line: ChatLine): boolean {
  return line.kind === 'reply' && line.words < REPLY_WORDS.length
}

export function ChatDemo() {
  const list = useRef<HTMLOListElement>(null)
  const { isAtBottom, scrollToBottom } = useStickToBottom(list)
  const { inView } = useInView(list)
  const [lines, setLines] = useState(INITIAL_LINES)
  const streaming = isStreaming(lines[lines.length - 1])

  useEffect(() => {
    if (!inView) return
    const timer = setTimeout(
      () => setLines(streaming ? growReply : appendNext),
      streaming ? WORD_DELAY : MESSAGE_DELAY
    )
    return () => clearTimeout(timer)
  }, [inView, streaming, lines])

  return (
    <div className="relative">
      <ol
        ref={list}
        aria-label="Chat"
        className="h-80 divide-y divide-black/5 overflow-y-auto overscroll-contain rounded-xl bg-white ring-1 ring-black/5"
      >
        {lines.map((line, index) => (
          <li key={index} className="flex gap-3 px-4 py-3">
            {line.kind === 'message' ? (
              <ChatMessage
                name={line.message.name}
                avatar={line.message.avatar}
                text={line.message.text}
              />
            ) : (
              <ChatMessage
                name="Assistant"
                avatar="from-indigo-500 to-purple-600"
                text={line.words === 0 ? '…' : REPLY_WORDS.slice(0, line.words).join(' ')}
              />
            )}
          </li>
        ))}
      </ol>
      {!isAtBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-[background-color,scale] hover:bg-indigo-700 active:scale-[0.96]"
        >
          <span aria-hidden="true">↓</span> New messages
        </button>
      )}
    </div>
  )
}

function ChatMessage({ name, avatar, text }: { name: string; avatar: string; text: string }) {
  return (
    <>
      <div className={`size-9 shrink-0 rounded-full bg-linear-to-br ${avatar}`} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-pretty text-gray-600">{text}</p>
      </div>
    </>
  )
}
