import type { CSSProperties, ReactNode } from 'react'
import { SECTIONS } from '../meta'

export function Section({
  id,
  kicker,
  signature,
  children,
}: {
  id: string
  kicker: string
  signature?: string
  children: ReactNode
}) {
  const meta = SECTIONS.find((section) => section.id === id)!
  return (
    <section id={id} className="sec" aria-labelledby={`${id}-title`}>
      <div className="sec-margin" aria-hidden="true">
        <span className="sec-num">{meta.num}</span>
      </div>
      <div className="sec-body">
        <p className="kicker">{kicker}</p>
        <h2 id={`${id}-title`} tabIndex={-1} className={meta.code ? 'h2-code' : undefined}>
          {meta.title}
        </h2>
        {signature && (
          <p className="sig">
            <code>{signature}</code>
          </p>
        )}
        {children}
      </div>
    </section>
  )
}

export function Figure({
  n,
  title,
  legend,
  className,
  children,
}: {
  n: string
  title: string
  legend?: ReactNode[]
  className?: string
  children: ReactNode
}) {
  return (
    <figure className={['fig', className].filter(Boolean).join(' ')}>
      <figcaption className="fig-head">
        <span className="fig-no">Fig. {n}</span>
        <span className="fig-title">{title}</span>
      </figcaption>
      <div className="fig-body">{children}</div>
      {legend && (
        <ol className="legend">
          {legend.map((item, index) => (
            <li key={index}>
              <span className="callout callout-inline" aria-hidden="true">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}
      <span className="reg reg-tl" aria-hidden="true" />
      <span className="reg reg-tr" aria-hidden="true" />
      <span className="reg reg-bl" aria-hidden="true" />
      <span className="reg reg-br" aria-hidden="true" />
    </figure>
  )
}

export function Callout({
  n,
  lead = 'left',
  out,
  style,
}: {
  n: number
  lead?: 'left' | 'right' | 'up' | 'down' | 'none'
  out?: boolean
  style?: CSSProperties
}) {
  return (
    <span
      className={`callout callout-at lead-${lead}${out ? ' is-out' : ''}`}
      style={style}
      aria-hidden="true"
    >
      {n}
    </span>
  )
}

export function DimV({ label, side = 'right' }: { label: string; side?: 'left' | 'right' }) {
  return (
    <span className={`dim dim-v dim-${side}`} aria-hidden="true">
      <span className="dim-arrow dim-a1" />
      <span className="dim-arrow dim-a2" />
      <span className="dim-label">{label}</span>
    </span>
  )
}

export function DimH({ label, className }: { label: string; className?: string }) {
  return (
    <span className={['dim', 'dim-h', className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className="dim-arrow dim-a1" />
      <span className="dim-arrow dim-a2" />
      <span className="dim-label">{label}</span>
    </span>
  )
}

export function Spec({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="spec-wrap">
      <table className="spec">
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} data-label={head[cellIndex]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Note({ label = 'Note', children }: { label?: string; children: ReactNode }) {
  return (
    <aside className="note">
      <span className="note-label">{label}</span>
      <div>{children}</div>
    </aside>
  )
}
