export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'skipped'

export interface TokenUsage {
  readonly input_tokens: number
  readonly output_tokens: number
}

export interface TaskExecutionMetrics {
  readonly startMs: number
  readonly endMs: number
  readonly durationMs: number
  readonly tokenUsage: TokenUsage
  readonly toolCalls: readonly unknown[]
}

export interface TaskExecutionRecord {
  readonly id: string
  readonly title: string
  readonly assignee?: string
  readonly status: TaskStatus
  readonly dependsOn: readonly string[]
  readonly metrics?: TaskExecutionMetrics
}

export interface TeamRunResult {
  readonly goal?: string
  readonly tasks?: readonly TaskExecutionRecord[]
}
