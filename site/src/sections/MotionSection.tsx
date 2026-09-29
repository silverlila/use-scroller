import { useEffect, useMemo, useRef, useState } from 'react'
import {
  animateScroll,
  cancelScroll,
  cubicBezier,
  easings,
  type Easing,
  type ScrollAnimation,
  type ScrollResult,
} from 'use-scroller'
import { useMediaQuery } from '../hooks'
import { CodeTabs } from '../parts/CodeTabs'
import { Callout, Figure, Section, Spec } from '../parts/Drawing'

type Kind = 'tween' | 'spring' | 'instant'
type EasingName = keyof typeof easings | 'custom'
type Bezier = [number, number, number, number]

const EASING_NAMES: EasingName[] = ['linear', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'custom']
const STOPS = [480, 2280]
const RAIL_WIDTH = 3200
const RAIL_INSET = 24
const PLOT = { w: 320, h: 220, left: 34, right: 10, top: 14, bottom: 26 }
const Y_MIN = -0.25
const Y_MAX = 1.25

interface Settings {
  kind: Kind
  easing: EasingName
  bezier: Bezier
  duration: number
  stiffness: number
  damping: number
  mass: number
  interruptible: boolean
  respectReducedMotion: boolean
}

const DEFAULTS: Settings = {
  kind: 'tween',
  easing: 'easeOutCubic',
  bezier: [0.2, 0.9, 0.1, 1],
  duration: 900,
  stiffness: 170,
  damping: 14,
  mass: 1,
  interruptible: true,
  respectReducedMotion: true,
}

function easingOf(settings: Settings): Easing {
  return settings.easing === 'custom' ? cubicBezier(...settings.bezier) : easings[settings.easing]
}

function animationOf(settings: Settings): ScrollAnimation {
  if (settings.kind === 'instant') return { type: 'instant' }
  if (settings.kind === 'spring') {
    const { stiffness, damping, mass } = settings
    return { type: 'spring', stiffness, damping, mass }
  }
  return { type: 'tween', duration: settings.duration, easing: easingOf(settings) }
}

function simulateSpring(settings: Settings, distance: number) {
  const dt = 1 / 120
  let position = 0
  let velocity = 0
  const points: Array<{ t: number; p: number }> = [{ t: 0, p: 0 }]
  for (let step = 1; step < 120 * 8; step++) {
    const force = -settings.stiffness * (position - distance) - settings.damping * velocity
    velocity += (force / settings.mass) * dt
    position += velocity * dt
    points.push({ t: step * dt * 1000, p: position / distance })
    if (Math.abs(position - distance) < 0.5 && Math.abs(velocity) < 10) break
  }
  return points
}

function specCurve(settings: Settings, distance: number) {
  if (settings.kind === 'instant') return { duration: 1, points: [{ t: 0, p: 0 }, { t: 0, p: 1 }, { t: 1, p: 1 }] }
  if (settings.kind === 'spring') {
    const points = simulateSpring(settings, distance)
    return { duration: points[points.length - 1].t, points }
  }
  const easing = easingOf(settings)
  const points = Array.from({ length: 101 }, (_, index) => ({
    t: (index / 100) * settings.duration,
    p: easing(index / 100),
  }))
  return { duration: settings.duration, points }
}

function plotX(t: number, duration: number) {
  const inner = PLOT.w - PLOT.left - PLOT.right
  return PLOT.left + Math.min(1.04, t / duration) * inner
}

function plotY(p: number) {
  const inner = PLOT.h - PLOT.top - PLOT.bottom
  const clamped = Math.max(Y_MIN, Math.min(Y_MAX, p))
  return PLOT.top + (1 - (clamped - Y_MIN) / (Y_MAX - Y_MIN)) * inner
}

function toPath(points: Array<{ t: number; p: number }>, duration: number) {
  return points
    .map((point, index) => `${index ? 'L' : 'M'}${plotX(point.t, duration).toFixed(1)} ${plotY(point.p).toFixed(1)}`)
    .join(' ')
}

function codeFor(settings: Settings, to: number) {
  const animation =
    settings.kind === 'instant'
      ? `{ type: 'instant' }`
      : settings.kind === 'spring'
        ? `{ type: 'spring', stiffness: ${settings.stiffness}, damping: ${settings.damping}, mass: ${settings.mass} }`
        : `{
    type: 'tween',
    duration: ${settings.duration},
    easing: ${
      settings.easing === 'custom'
        ? `cubicBezier(${settings.bezier.map((value) => value.toFixed(2)).join(', ')})`
        : `easings.${settings.easing}`
    },
  }`
  return `import { animateScroll, cancelScroll, easings, cubicBezier } from 'use-scroller/core'

const handle = animateScroll(rail, { x: ${to} }, {
  animation: ${animation},
  interruptible: ${settings.interruptible},
  respectReducedMotion: ${settings.respectReducedMotion},
})
const result = await handle.finished // 'completed' | 'interrupted' | 'cancelled'

cancelScroll(rail) // the Stop button`
}

const EASINGS_CODE = `import { easings, cubicBezier, type Easing } from 'use-scroller'

easings.linear          // t => t
easings.easeInCubic
easings.easeOutCubic    // the tween default
easings.easeInOutCubic

// Any CSS cubic-bezier(). x1 and x2 must be within [0, 1].
const snappy: Easing = cubicBezier(0.2, 0.9, 0.1, 1)

useScroll(ref, { animation: { type: 'tween', duration: 300, easing: snappy } })`

export function MotionSection() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [status, setStatus] = useState<{ result: ScrollResult | 'running'; ms: number } | null>(null)
  const rail = useRef<HTMLDivElement>(null)
  const trace = useRef<SVGPathElement>(null)
  const [nextStop, setNextStop] = useState(STOPS[1])
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const spec = useMemo(() => specCurve(settings, STOPS[1] - STOPS[0]), [settings])

  useEffect(() => {
    rail.current?.scrollTo({ left: STOPS[0], behavior: 'instant' })
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  function run() {
    const element = rail.current
    if (!element) return
    const from = element.scrollLeft
    const to = Math.abs(from - STOPS[0]) < Math.abs(from - STOPS[1]) ? STOPS[1] : STOPS[0]
    setNextStop(to === STOPS[0] ? STOPS[1] : STOPS[0])
    const distance = to - from || 1
    const samples: Array<{ t: number; p: number }> = [{ t: 0, p: 0 }]
    const startedAt = performance.now()
    let frame = 0
    const record = () => {
      samples.push({ t: performance.now() - startedAt, p: (element.scrollLeft - from) / distance })
      trace.current?.setAttribute('d', toPath(samples, spec.duration))
      frame = requestAnimationFrame(record)
    }
    frame = requestAnimationFrame(record)
    setStatus({ result: 'running', ms: 0 })
    const handle = animateScroll(element, { x: to }, {
      animation: animationOf(settings),
      interruptible: settings.interruptible,
      respectReducedMotion: settings.respectReducedMotion,
    })
    void handle.finished.then((result) => {
      cancelAnimationFrame(frame)
      const ms = performance.now() - startedAt
      samples.push({ t: ms, p: (element.scrollLeft - from) / distance })
      trace.current?.setAttribute('d', toPath(samples, spec.duration))
      setStatus({ result, ms })
    })
  }

  const grid = [0, 0.25, 0.5, 0.75, 1]

  return (
    <Section
      id="motion"
      kicker="Animation engine · core"
      signature="animateScroll(target, { x?, y? }, { animation?, interruptible?, respectReducedMotion? }) → ScrollHandle"
    >
      <p className="lede">
        Everything that moves goes through <code>animateScroll</code>. Pick a{' '}
        <code>tween</code> with an easing, a physical <code>spring</code>, or an{' '}
        <code>instant</code> jump. Targets are clamped to the scroll range every frame, and a
        missing axis does not move.
      </p>
      <Figure
        n="03"
        title="Motion bench: the specified curve against the measured scroll"
        className="fig-motion"
        legend={[
          <>
            The dashed curve is the specification: the easing function, or the spring simulated
            with your settings.
          </>,
          <>
            The solid line is measured from <code>rail.scrollLeft</code> every frame while the
            animation runs. Grab the rail mid-run to see it stop.
          </>,
          <>
            The rail: a plain <code>overflow-x: auto</code> element. The needle marks its current
            scroll position.
          </>,
        ]}
      >
        <div className="mb">
          <form className="mb-controls" onSubmit={(event) => { event.preventDefault(); run() }}>
            <fieldset className="field">
              <legend className="field-label">animation.type</legend>
              <div className="seg">
                {(['tween', 'spring', 'instant'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className="seg-btn"
                    aria-pressed={settings.kind === kind}
                    onClick={() => update('kind', kind)}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </fieldset>

            {settings.kind === 'tween' && (
              <>
                <label className="field">
                  <span className="field-label">easing</span>
                  <select
                    className="select"
                    value={settings.easing}
                    onChange={(event) => update('easing', event.target.value as EasingName)}
                  >
                    {EASING_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name === 'custom' ? 'cubicBezier(…)' : `easings.${name}`}
                      </option>
                    ))}
                  </select>
                </label>
                {settings.easing === 'custom' && (
                  <div className="bezier">
                    {(['x1', 'y1', 'x2', 'y2'] as const).map((name, index) => (
                      <Range
                        key={name}
                        label={name}
                        min={name.startsWith('x') ? 0 : -0.5}
                        max={name.startsWith('x') ? 1 : 1.5}
                        step={0.01}
                        value={settings.bezier[index]}
                        format={(value) => value.toFixed(2)}
                        onChange={(value) => {
                          const next = [...settings.bezier] as Bezier
                          next[index] = value
                          update('bezier', next)
                        }}
                      />
                    ))}
                  </div>
                )}
                <Range
                  label="duration"
                  min={100}
                  max={2400}
                  step={50}
                  value={settings.duration}
                  format={(value) => `${value} ms`}
                  onChange={(value) => update('duration', value)}
                />
              </>
            )}
            {settings.kind === 'spring' && (
              <>
                <Range label="stiffness" min={20} max={400} step={5} value={settings.stiffness} onChange={(value) => update('stiffness', value)} />
                <Range label="damping" min={4} max={60} step={1} value={settings.damping} onChange={(value) => update('damping', value)} />
                <Range label="mass" min={0.5} max={5} step={0.1} value={settings.mass} format={(value) => value.toFixed(1)} onChange={(value) => update('mass', value)} />
              </>
            )}
            {settings.kind === 'instant' && (
              <p className="field-note">No frames: the position is written once.</p>
            )}

            <div className="checks">
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.interruptible}
                  onChange={(event) => update('interruptible', event.target.checked)}
                />
                <span>interruptible</span>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.respectReducedMotion}
                  onChange={(event) => update('respectReducedMotion', event.target.checked)}
                />
                <span>respectReducedMotion</span>
              </label>
            </div>
            {reduced && settings.respectReducedMotion && (
              <p className="field-note">
                Your system asks for reduced motion, so every run jumps instantly. Untick
                respectReducedMotion to watch the curve.
              </p>
            )}
            <div className="mb-actions">
              <button type="submit" className="btn btn-dark">
                Run to x = {nextStop}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => rail.current && cancelScroll(rail.current)}
              >
                cancelScroll(rail)
              </button>
            </div>
          </form>

          <div className="mb-plot">
            <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} role="img" aria-label="Scroll progress over time: specified curve and measured trace">
              {grid.map((p) => (
                <g key={`h${p}`}>
                  <line x1={PLOT.left} x2={PLOT.w - PLOT.right} y1={plotY(p)} y2={plotY(p)} className={p === 0 || p === 1 ? 'plot-axis' : 'plot-grid'} />
                  <text x={PLOT.left - 6} y={plotY(p) + 3} textAnchor="end" className="plot-text">
                    {p}
                  </text>
                </g>
              ))}
              {grid.map((t) => (
                <line key={`v${t}`} x1={plotX(t, 1)} x2={plotX(t, 1)} y1={plotY(Y_MAX)} y2={plotY(Y_MIN)} className="plot-grid" />
              ))}
              <text x={PLOT.w - PLOT.right} y={PLOT.h - 6} textAnchor="end" className="plot-text">
                t → {settings.kind === 'instant' ? '0 ms' : `${Math.round(spec.duration)} ms`}
              </text>
              <text x={PLOT.left} y={PLOT.h - 6} className="plot-text">
                0
              </text>
              <path d={toPath(spec.points, spec.duration)} className="plot-spec" />
              <path ref={trace} className="plot-trace" />
            </svg>
            <Callout n={1} lead="down" style={{ top: -14, left: '38%' }} />
            <Callout n={2} lead="up" style={{ bottom: -14, left: '66%' }} />
            <p className="mb-status" aria-live="polite">
              {status === null
                ? 'Press Run to record a trace.'
                : status.result === 'running'
                  ? 'Recording…'
                  : `→ '${status.result}' after ${Math.round(status.ms)} ms`}
            </p>
          </div>
        </div>

        <div className="rail-demo">
          <div ref={rail} className="mb-rail scroll-box" tabIndex={0} aria-label="Rail, 3200 px wide">
            <div className="mb-rail-content" style={{ width: RAIL_WIDTH + RAIL_INSET * 2 }}>
              {Array.from({ length: RAIL_WIDTH / 200 + 1 }, (_, index) => (
                <span key={index} className="mb-rail-label" style={{ left: RAIL_INSET + index * 200 }}>
                  {index * 200}
                </span>
              ))}
              {STOPS.map((stop) => (
                <span key={stop} className="mb-rail-stop" style={{ left: RAIL_INSET + stop }}>
                  stop x = {stop}
                </span>
              ))}
            </div>
          </div>
          <span className="mb-needle" aria-hidden="true" />
          <Callout n={3} lead="down" style={{ top: -30, left: 16 }} />
        </div>
      </Figure>
      <CodeTabs
        tabs={[
          { label: 'This run', file: 'bench.ts', code: codeFor(settings, nextStop) },
          { label: 'Easings', file: 'easing.ts', code: EASINGS_CODE },
        ]}
      />
      <Spec
        head={['Option', 'Default', 'Notes']}
        rows={[
          [<code>animation</code>, <code>{"{ type: 'tween' }"}</code>, <>tween: <code>duration</code> 450, <code>easing</code> easeOutCubic. spring: <code>stiffness</code> 170, <code>damping</code> 26, <code>mass</code> 1, <code>velocity</code>. Or instant.</>],
          [<code>interruptible</code>, <code>true</code>, <>wheel, touchstart, pointerdown or keydown on the target stops it with <code>'interrupted'</code>.</>],
          [<code>respectReducedMotion</code>, <code>true</code>, <>Jumps instantly when <code>prefers-reduced-motion: reduce</code> matches.</>],
        ]}
      />
      <p className="fine">
        While it runs, <code>animateScroll</code> pauses CSS scroll snapping on the target so snap
        points cannot yank it off course. <code>cancelScroll(target)</code> stops whatever is
        running on that target.
      </p>
    </Section>
  )
}

function Range({
  label,
  min,
  max,
  step,
  value,
  format = String,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label className="range">
      <span className="range-head">
        <span className="field-label">{label}</span>
        <output className="range-value">{format(value)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
