import type { TeamRunResult, TokenUsage } from '@open-multi-agent/core'
import type { RunHealth, RunSnapshot, RunStatus } from './run.js'

export type { RunHealth, RunHealthIssue } from './run.js'

export const DEFAULT_RUN_STALL_MS = 300_000

export function parseRunStallMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.FORGE_RUN_STALL_MS
  if (raw === undefined || raw.trim() === '') return DEFAULT_RUN_STALL_MS
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RUN_STALL_MS
}

function tokenTotal(usage: TokenUsage | undefined): number {
  if (!usage) return 0
  return (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)
}

/** Signals that the workflow subprocess reported success without useful output. */
export function assessRunCompletion(
  result: TeamRunResult,
  traceLineCount: number,
): RunHealth {
  if (!result.success) {
    return { ok: true }
  }

  if (result.planOnly) {
    return { ok: true }
  }

  const tasks = result.tasks ?? []
  const tokens = tokenTotal(result.totalTokenUsage)
  const hasTrace = traceLineCount > 0
  const hasCompletedTask = tasks.some((task) => task.status === 'completed')
  const hasShortCircuit = tasks.some(
    (task) => task.id === 'short-circuit' && task.status === 'completed',
  )

  if (tasks.length === 0 && !hasTrace && tokens === 0) {
    return {
      ok: false,
      issue: 'empty_output',
      message:
        'Run reported success but produced no tasks, trace events, or token usage.',
    }
  }

  if (tasks.length > 0 && !hasCompletedTask && !hasShortCircuit) {
    const terminal = tasks.every(
      (task) =>
        task.status === 'failed' ||
        task.status === 'skipped' ||
        task.status === 'blocked',
    )
    const allPending = tasks.every((task) => task.status === 'pending')
    if (terminal || allPending) {
      return {
        ok: false,
        issue: 'task_failures',
        message: 'Run reported success but no task reached a completed state.',
      }
    }
  }

  return { ok: true }
}

export function unhealthyRunHealth(
  issue: NonNullable<RunHealth['issue']>,
  message: string,
): RunHealth {
  return { ok: false, issue, message }
}

/** User-facing label for header/history; surfaces health issues over raw status. */
export function formatRunStatusLabel(
  status: RunStatus,
  health?: RunHealth,
): string {
  if (health && !health.ok) {
    const tag = health.issue ?? 'unhealthy'
    return `failed (${tag})`
  }
  return status
}

export function runStatusTone(
  status: RunStatus,
  health?: RunHealth,
): 'success' | 'error' | 'warn' | 'neutral' {
  if (health && !health.ok) return 'error'
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'cancelled':
      return 'warn'
    case 'running':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function healthBanner(snapshot: Pick<RunSnapshot, 'status' | 'health'>): string | null {
  if (!snapshot.health || snapshot.health.ok) return null
  return snapshot.health.message ?? `Run ended unhealthy (${snapshot.health.issue ?? 'unknown'})`
}
