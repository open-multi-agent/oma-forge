import type { TaskExecutionRecord } from '@open-multi-agent/core'

export type RunStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type RunSnapshot = {
  readonly id?: string
  readonly status: RunStatus
  readonly goal?: string
  readonly workflowPath?: string
  readonly tasks: readonly TaskExecutionRecord[]
  readonly startedAt?: number
  readonly finishedAt?: number
}

/** Compact entry for run history lists. */
export type RunSummary = {
  readonly id: string
  readonly status: Exclude<RunStatus, 'idle'>
  readonly goal?: string
  readonly workflowPath?: string
  readonly startedAt: number
  readonly finishedAt?: number
}
