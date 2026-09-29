export type Easing = (t: number) => number

export const easings = {
  linear: (t: number) => t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - (1 - t) ** 3,
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
} satisfies Record<string, Easing>

interface Polynomial {
  a: number
  b: number
  c: number
}

const PRECISION = 1e-7
const NEWTON_ITERATIONS = 8
const MIN_SLOPE = 1e-6

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new RangeError(`cubicBezier: x1 and x2 must be within [0, 1], got ${x1} and ${x2}`)
  }
  const xCurve = polynomial(x1, x2)
  const yCurve = polynomial(y1, y2)
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return sample(yCurve, solveForParameter(xCurve, t))
  }
}

function polynomial(p1: number, p2: number): Polynomial {
  const c = 3 * p1
  const b = 3 * (p2 - p1) - c
  return { a: 1 - c - b, b, c }
}

function sample({ a, b, c }: Polynomial, t: number): number {
  return ((a * t + b) * t + c) * t
}

function slope({ a, b, c }: Polynomial, t: number): number {
  return (3 * a * t + 2 * b) * t + c
}

function solveForParameter(curve: Polynomial, x: number): number {
  return newton(curve, x) ?? bisect(curve, x)
}

function newton(curve: Polynomial, x: number): number | null {
  let t = x
  for (let i = 0; i < NEWTON_ITERATIONS; i++) {
    const error = sample(curve, t) - x
    if (Math.abs(error) < PRECISION) return t
    const derivative = slope(curve, t)
    if (Math.abs(derivative) < MIN_SLOPE) return null
    t -= error / derivative
    if (t < 0 || t > 1) return null
  }
  return null
}

function bisect(curve: Polynomial, x: number): number {
  let low = 0
  let high = 1
  let t = x
  while (high - low > PRECISION) {
    const value = sample(curve, t)
    if (Math.abs(value - x) < PRECISION) return t
    if (value < x) low = t
    else high = t
    t = (low + high) / 2
  }
  return t
}
