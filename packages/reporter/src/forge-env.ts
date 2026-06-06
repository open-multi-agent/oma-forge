import { createForgeReporter, type ForgeReporter } from './reporter.js'
import { noopForgeReporter } from './noop-reporter.js'

let reporter: ForgeReporter | undefined
let abortController: AbortController | undefined

function initForgeRun(): ForgeReporter {
  const runId = process.env.FORGE_RUN_ID
  if (!runId) return noopForgeReporter

  if (!reporter) {
    reporter = createForgeReporter(runId)
    abortController = new AbortController()
    process.on('SIGTERM', () => abortController?.abort())
  }
  return reporter
}

/** Reporter that streams to Forge when `FORGE_RUN_ID` is set; no-op otherwise. */
export function getForgeReporter(): ForgeReporter {
  return process.env.FORGE_RUN_ID ? initForgeRun() : noopForgeReporter
}

export function forgeRunId(): string | undefined {
  return process.env.FORGE_RUN_ID
}

export function forgeAbortSignal(): AbortSignal {
  initForgeRun()
  return abortController?.signal ?? new AbortController().signal
}
