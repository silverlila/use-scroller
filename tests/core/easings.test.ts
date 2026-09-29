import { describe, expect, test } from 'vitest'
import { cubicBezier, easings } from '../../src/core'

describe('easings', () => {
  test.each(Object.entries(easings))('%s starts at 0 and ends at 1', (_, easing) => {
    expect(easing(0)).toBe(0)
    expect(easing(1)).toBe(1)
  })

  test('cubic curves have their known midpoints', () => {
    expect(easings.linear(0.5)).toBe(0.5)
    expect(easings.easeInCubic(0.5)).toBe(0.125)
    expect(easings.easeOutCubic(0.5)).toBe(0.875)
    expect(easings.easeInOutCubic(0.25)).toBe(0.0625)
    expect(easings.easeInOutCubic(0.75)).toBe(0.9375)
  })
})

describe('cubicBezier', () => {
  test('matches the CSS ease curve', () => {
    const ease = cubicBezier(0.25, 0.1, 0.25, 1)

    expect(ease(0.5)).toBeCloseTo(0.8024, 4)
  })

  test('maps the endpoints exactly, even for a curve that overshoots', () => {
    const backOut = cubicBezier(0.34, 1.56, 0.64, 1)

    expect(backOut(0)).toBe(0)
    expect(backOut(1)).toBe(1)
    expect(backOut(0.6)).toBeGreaterThan(1)
  })

  test('solves a curve whose slope is flat at the midpoint', () => {
    const steepInOut = cubicBezier(1, 0, 0, 1)

    expect(steepInOut(0.5)).toBeCloseTo(0.5, 5)
    expect(steepInOut(0.25) + steepInOut(0.75)).toBeCloseTo(1, 5)
  })

  test('rejects control points whose x lies outside [0, 1]', () => {
    expect(() => cubicBezier(-0.1, 0, 0.5, 1)).toThrow(RangeError)
    expect(() => cubicBezier(0.5, 0, 1.2, 1)).toThrow(RangeError)
  })
})
