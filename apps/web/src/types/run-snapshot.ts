import type { TaskExecutionRecord } from './team-run.ts'

export type RunStatus = 'idle' | 'running' | 'completed' | 'failed'

export type RunSnapshot = {
  readonly status: RunStatus
  readonly goal?: string
  readonly tasks: readonly TaskExecutionRecord[]
}
