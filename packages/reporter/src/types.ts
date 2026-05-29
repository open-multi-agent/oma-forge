import type { ForgeReporter } from './reporter.js'

export type ForgeRunContext = {
  readonly runId: string
  readonly goal: string
  readonly abortSignal: AbortSignal
  readonly reporter: ForgeReporter
}
