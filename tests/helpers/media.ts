/// <reference types="@vitest/browser-playwright" />
import { onTestFinished } from 'vitest'
import { cdp } from 'vitest/browser'

export async function emulateReducedMotion(): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  onTestFinished(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] })
  })
}
