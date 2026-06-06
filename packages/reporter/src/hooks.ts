import type { TeamRunResult } from '@open-multi-agent/core'
import { getForgeReporter } from './forge-env.js'

/**
 * Spread into `new OpenMultiAgent({ ...yourConfig, ...forgeHooks() })` so Forge can stream
 * progress and trace. No-op when the file is not run as a Forge subprocess.
 */
export function forgeHooks() {
  const reporter = getForgeReporter()
  return {
    onProgress: reporter.onProgress,
    onTrace: reporter.onTrace,
    onPlanReady: reporter.onPlanReady,
    onAgentStream: reporter.onAgentStream,
  }
}

export function forgeFinish(result: TeamRunResult): void {
  getForgeReporter().finish(result)
}

export function forgeFail(message: string): void {
  getForgeReporter().fail(message)
}

export function isTeamRunResult(value: unknown): value is TeamRunResult {
  if (typeof value !== 'object' || value === null) return false
  return 'success' in value && 'goal' in value && 'tasks' in value
}
