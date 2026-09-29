import { useEffect, useRef, useState, type FormEvent } from 'react'
import { stickToBottom, useInView, useStickToBottom, type StickToBottom } from 'use-scroller'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, DimV, Figure, Section } from '../parts/Drawing'
import { useElementSize } from '../hooks'

interface Person {
  name: string
  initials: string
  tone: number
}

const PEOPLE: Person[] = [
  { name: 'Mara', initials: 'MA', tone: 1 },
  { name: 'Jonas', initials: 'JO', tone: 2 },
  { name: 'Ines', initials: 'IN', tone: 3 },
]
const ASSISTANT: Person = { name: 'Assistant', initials: 'AI', tone: 4 }
const YOU: Person = { name: 'You', initials: 'YO', tone: 0 }

const SCRIPT = [
  'Morning. Is the 2.0 changelog final?',
  'Almost. Waiting on the drag-scroll notes.',
  'The chat demo should follow new messages without jumping when I scroll up.',
  'That is what stickToBottom does. Try it now: scroll up a little.',
  'The button in the corner counts what arrived while you were away.',
  'Pushed the fix for the snap landing on Android.',
  'Can someone verify the iOS lock on a real device?',
  'On it after lunch.',
  'Docs build is green.',
  'Tagging the release in ten minutes.',
]

const REPLIES = [
  'This reply streams in word by word and grows in place, the way an AI answer or a build log does. While you are at the bottom, the list follows every new word without lagging behind. Scroll up and it stays where you left it.',
  'The jump to the new bottom is instant, so streamed text never trails behind the viewport. Scrolling up more than 8 px stops the following; coming back within 8 px resumes it.',
  'Growth is watched on the element and its direct children: a new message, a message getting taller, or text changing inside the list.',
]

type Line =
  | { id: number; kind: 'message'; person: Person; text: string; time: string }
  | { id: number; kind: 'reply'; text: string; words: number; time: string }

const MESSAGE_DELAY = 2400
const WORD_DELAY = 55
const REPLY_EVERY = 4
const LIMIT = 60

let nextId = 0
function clock(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60000)
  return date.toTimeString().slice(0, 5)
}

const INITIAL: Line[] = SCRIPT.slice(0, 5).map((text, index) => ({
  id: nextId++,
  kind: 'message',
  person: PEOPLE[index % PEOPLE.length],
  text,
  time: clock(index - 5),
}))

function appendNext(lines: Line[]): Line[] {
  const count = lines.length
  const next: Line =
    count % REPLY_EVERY === REPLY_EVERY - 1
      ? { id: nextId++, kind: 'reply', text: REPLIES[count % REPLIES.length], words: 0, time: clock() }
      : {
          id: nextId++,
          kind: 'message',
          person: PEOPLE[count % PEOPLE.length],
          text: SCRIPT[count % SCRIPT.length],
          time: clock(),
        }
  return [...lines, next]
}

function growReply(lines: Line[]): Line[] {
  return lines.map((line, index) =>
    index === lines.length - 1 && line.kind === 'reply' ? { ...line, words: line.words + 1 } : line
  )
}

function isStreaming(line: Line) {
  return line.kind === 'reply' && line.words < line.text.split(' ').length
}

const REACT_CODE = `import { useRef } from 'react'
import { useStickToBottom } from 'use-scroller'

function Chat({ messages }: { messages: Message[] }) {
  const list = useRef<HTMLOListElement>(null)
  const { isAtBottom, scrollToBottom } = useStickToBottom(list)

  return (
    <div style={{ position: 'relative' }}>
      <ol ref={list} style={{ overflow: 'auto', height: 400 }}>
        {messages.map((message) => (
          <li key={message.id}>{message.text}</li>
        ))}
      </ol>
      {!isAtBottom && (
        <button onClick={() => scrollToBottom()}>↓ New messages</button>
      )}
    </div>
  )
}

// Sending your own message: jump back down, then keep following
function send(text: string) {
  setMessages((all) => [...all, { id: crypto.randomUUID(), text }])
  scrollToBottom()
}`

const CORE_CODE = `import { stickToBottom } from 'use-scroller/core'

const sticky = stickToBottom(log, (isAtBottom) => {
  followButton.hidden = isAtBottom // called once on attach, then on change
})

sticky.scrollToBottom({ animation: { type: 'spring' } }) // returns a ScrollHandle
sticky.stop() // scrollToBottom throws after stop()`

export function ChatSection() {
  return (
    <Section
      id="stick-to-bottom"
      kicker="Chats, logs, streaming replies · React hook + core"
      signature="useStickToBottom(ref) → { isAtBottom, scrollToBottom(options?) }"
    >
      <p className="lede">
        Keeps a chat, log or streaming reply pinned to its newest line, and lets go the moment the
        reader scrolls up. It jumps to the bottom on mount; while at the bottom it follows every new
        child, every child that grows, and text changing inside the element.
      </p>
      <Figure
        n="05"
        title="A chat that follows new messages, and a log driven from core"
        className="fig-chat"
        legend={[
          <>
            The <code>&lt;ol ref={'{list}'}&gt;</code> passed to <code>useStickToBottom</code>. A
            message arrives every few seconds while it is on screen.
          </>,
          <>
            Every fourth line is a reply that streams in word by word. The list follows each word.
          </>,
          <>
            Scroll up: <code>isAtBottom</code> turns false and this button appears, counting what
            arrived since. It calls <code>scrollToBottom()</code>.
          </>,
          <>
            Sending calls <code>scrollToBottom()</code> too, so your own message is always in view.
          </>,
          <>
            A build log using core <code>stickToBottom(log, onChange)</code> directly.
          </>,
        ]}
      >
        <div className="chat-grid">
          <ChatDemo />
          <BuildLog />
        </div>
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'React', file: 'Chat.tsx', code: REACT_CODE },
          { label: 'Core', file: 'log.ts', code: CORE_CODE },
        ]}
      />
      <p className="fine">
        Scrolling up more than 8 px stops the following; coming back within 8 px resumes it.{' '}
        <code>scrollToBottom(options?)</code> takes the <code>animateScroll</code> options and
        throws if the ref is not attached. The target must be an element, not the window.
      </p>
    </Section>
  )
}

function ChatDemo() {
  const list = useRef<HTMLOListElement>(null)
  const { isAtBottom, scrollToBottom } = useStickToBottom(list)
  const { inView } = useInView(list)
  const [lines, setLines] = useState(INITIAL)
  const [auto, setAuto] = useState(true)
  const [draft, setDraft] = useState('')
  const [seen, setSeen] = useState(INITIAL.length)
  const { height } = useElementSize(list)
  const replyTimer = useRef<number | undefined>(undefined)
  const last = lines[lines.length - 1]
  const streaming = isStreaming(last)
  const unread = isAtBottom ? 0 : Math.max(0, lines.length - seen)
  const lastReply = [...lines].reverse().find((line) => line.kind === 'reply')?.id

  useEffect(() => {
    if (isAtBottom) setSeen(lines.length)
  }, [isAtBottom, lines.length])

  useEffect(() => {
    if (!inView) return
    if (!streaming && (!auto || lines.length >= LIMIT)) return
    const timer = setTimeout(
      () => setLines(streaming ? growReply : appendNext),
      streaming ? WORD_DELAY : MESSAGE_DELAY
    )
    return () => clearTimeout(timer)
  }, [inView, auto, streaming, lines])

  useEffect(() => () => clearTimeout(replyTimer.current), [])

  function send(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    setLines((current) => [
      ...current,
      { id: nextId++, kind: 'message', person: YOU, text, time: clock() },
    ])
    scrollToBottom()
    clearTimeout(replyTimer.current)
    replyTimer.current = window.setTimeout(() => {
      setLines((current) => [
        ...current,
        {
          id: nextId++,
          kind: 'reply',
          text: `Got “${text.slice(0, 60)}”. Your message went in at the bottom and the list followed it. Now scroll up while I type this sentence and notice that I stop pulling you down.`,
          words: 0,
          time: clock(),
        },
      ])
    }, 700)
  }

  return (
    <div className="chat">
      <div className="chat-head">
        <p className="chat-title">
          <span className="chat-hash" aria-hidden="true">#</span>release-2-0
          <span className="chat-sub">{PEOPLE.length + 1} members</span>
        </p>
        <label className="check check-sm">
          <input type="checkbox" checked={auto} onChange={(event) => setAuto(event.target.checked)} />
          <span>auto messages</span>
        </label>
      </div>
      <div className="chat-body">
        <ol ref={list} className="chat-list" aria-label="Messages" tabIndex={0}>
          {lines.map((line) => (
            <li key={line.id} className={line.kind === 'reply' ? 'msg is-reply' : 'msg'}>
              <ChatLine line={line} mark={line.id === lastReply} />
            </li>
          ))}
        </ol>
        {!isAtBottom && (
          <button type="button" className="chat-jump" onClick={() => scrollToBottom()}>
            <span aria-hidden="true">↓</span>{' '}
            {unread > 0 ? `${unread} new message${unread === 1 ? '' : 's'}` : 'New messages'}
          </button>
        )}
        <Callout n={1} lead="none" style={{ top: -11, right: 16 }} />
        {!isAtBottom && <Callout n={3} lead="down" style={{ bottom: 58, left: 'calc(50% - 11px)' }} />}
        <DimV label={`${height} px`} />
      </div>
      <form className="chat-form" onSubmit={send}>
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          className="input"
          placeholder="Write a message…"
          value={draft}
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn btn-dark" disabled={!draft.trim()}>
          Send
        </button>
        <Callout n={4} lead="left" out style={{ top: 9, right: -34 }} />
      </form>
    </div>
  )
}

function ChatLine({ line, mark }: { line: Line; mark: boolean }) {
  const person = line.kind === 'reply' ? ASSISTANT : line.person
  const words = line.kind === 'reply' ? line.text.split(' ') : []
  const streaming = line.kind === 'reply' && line.words < words.length
  const text = line.kind === 'reply' ? words.slice(0, line.words).join(' ') : line.text
  return (
    <>
      <span className={`avatar tone-${person.tone}`} aria-hidden="true">
        {person.initials}
      </span>
      <div className="msg-main">
        <p className="msg-meta">
          <strong>{person.name}</strong> <time>{line.time}</time>
          {line.kind === 'reply' && streaming && <span className="msg-tag">streaming</span>}
        </p>
        <p className="msg-text">
          {text || '…'}
          {streaming && <span className="caret" aria-hidden="true" />}
        </p>
        {mark && <Callout n={2} lead="left" style={{ top: 0, right: 0 }} />}
      </div>
    </>
  )
}

const LOG_STEPS = [
  'resolve  src/core/index.ts',
  'resolve  src/react/index.ts',
  'transform  animate-scroll.ts',
  'transform  stick-to-bottom.ts',
  'transform  drag-scroll.ts',
  'transform  lock-scroll.ts',
  'emit  dist/core.js',
  'emit  dist/react.js',
  'types  dist/index.d.ts',
  'check  size limit ok',
]

function BuildLog() {
  const log = useRef<HTMLOListElement>(null)
  const sticky = useRef<StickToBottom | null>(null)
  const [following, setFollowing] = useState(true)
  const [count, setCount] = useState(14)
  const { inView } = useInView(log)

  useEffect(() => {
    const element = log.current
    if (!element) return
    const attached = stickToBottom(element, setFollowing)
    sticky.current = attached
    return () => {
      attached.stop()
      sticky.current = null
    }
  }, [])

  useEffect(() => {
    if (!inView) return
    const timer = setInterval(() => setCount((current) => (current >= 240 ? 14 : current + 1)), 320)
    return () => clearInterval(timer)
  }, [inView])

  return (
    <div className="blog">
      <div className="blog-head">
        <p className="blog-title">build.log</p>
        <p className={following ? 'blog-state is-on' : 'blog-state'}>
          {following ? 'following' : 'paused'}
        </p>
      </div>
      <div className="blog-body">
        <ol ref={log} className="blog-list" tabIndex={0} aria-label="Build log">
          {Array.from({ length: count }, (_, index) => (
            <li key={index}>
              <span className="blog-n">{String(index + 1).padStart(3, '0')}</span>
              {LOG_STEPS[index % LOG_STEPS.length]}
              {index % LOG_STEPS.length === LOG_STEPS.length - 1 && ' ✓'}
            </li>
          ))}
        </ol>
        <Callout n={5} lead="down" style={{ top: -52, right: 12 }} />
      </div>
      <button
        type="button"
        className="btn btn-block"
        disabled={following}
        onClick={() => sticky.current?.scrollToBottom({ animation: { type: 'spring' } })}
      >
        sticky.scrollToBottom()
      </button>
    </div>
  )
}
