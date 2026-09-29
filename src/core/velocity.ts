export interface Sample {
  time: number
  position: number
}

const VELOCITY_WINDOW_MS = 100

export function recordSample(samples: Sample[], sample: Sample): void {
  samples.push(sample)
  while (sample.time - samples[0].time > VELOCITY_WINDOW_MS) samples.shift()
}

export function releaseVelocity(samples: Sample[]): number {
  const first = samples[0]
  const last = samples[samples.length - 1]
  const elapsed = last.time - first.time
  return elapsed > 0 ? ((last.position - first.position) / elapsed) * 1000 : 0
}
