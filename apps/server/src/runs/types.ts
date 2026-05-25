import type { TaskExecutionRecord } from '@open-multi-agent/core'

export type RunStatus = 'idle' | 'running' | 'completed' | 'failed'

export type RunSnapshot = {
  readonly status: RunStatus
  readonly goal?: string
  readonly tasks: readonly TaskExecutionRecord[]
}
