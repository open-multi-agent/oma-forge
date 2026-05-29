export type TraceLineLevel = 'info' | 'warn' | 'error' | 'stream'

export type ForgeTraceLine = {
  readonly runId: string
  readonly at: number
  readonly level: TraceLineLevel
  readonly agent?: string
  readonly taskId?: string
  readonly message: string
}

export type TraceLogSnapshot = {
  readonly lines: readonly ForgeTraceLine[]
}
