import { restoreScroll, type RestoreScrollOptions } from '../core'
import { useElementEffect, type ElementTarget } from './use-element-effect'

export function useScrollRestoration(
  target: ElementTarget,
  key: string,
  { storage, timeout }: RestoreScrollOptions = {}
): void {
  useElementEffect(target, (element) => restoreScroll(element, key, { storage, timeout }), [
    key,
    storage,
    timeout,
  ])
}
