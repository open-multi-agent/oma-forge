import type { TaskExecutionRecord } from '@open-multi-agent/core'

export type RunStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

/** Why a run is unhealthy when status alone would mislead (e.g. false "completed"). */
export type RunHealthIssue =
  | 'stall_timeout'
  | 'no_result'
  | 'empty_output'
  | 'workflow_error'
  | 'task_failures'

export type RunHealth = {
  readonly ok: boolean
  readonly issue?: RunHealthIssue
  readonly message?: string
}

export type RunSnapshot = {
  readonly id?: string
  readonly status: RunStatus
  readonly health?: RunHealth
  readonly goal?: string
  readonly workflowPath?: string
  readonly tasks: readonly TaskExecutionRecord[]
  readonly startedAt?: number
  readonly finishedAt?: number
  readonly lastActivityAt?: number
}

/** Compact entry for run history lists. */
export type RunSummary = {
  readonly id: string
  readonly status: Exclude<RunStatus, 'idle'>
  readonly health?: RunHealth
  readonly goal?: string
  readonly workflowPath?: string
  readonly startedAt: number
  readonly finishedAt?: number
}
