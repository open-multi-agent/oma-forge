import { parseRunStallMs } from '@oma-forge/shared'
import type { RunSession } from './session.js'

export type RunWatchdog = {
  readonly reset: () => void
  readonly stop: () => void
}

export function createRunWatchdog(
  session: RunSession,
  onStall: () => void,
  stallMs: number = parseRunStallMs(),
): RunWatchdog {
  let timer: ReturnType<typeof setTimeout> | undefined

  const reset = () => {
    if (timer) clearTimeout(timer)
    if (!session.isRunning()) return
    timer = setTimeout(() => {
      if (session.isRunning()) onStall()
    }, stallMs)
  }

  const stop = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  reset()
  return { reset, stop }
}
