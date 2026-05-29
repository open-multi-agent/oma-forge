import { createForgeReporter } from './reporter.js'
import type { ForgeRunContext } from './types.js'

/**
 * Runs a workflow when Forge spawns it as a subprocess.
 * No-ops when the file is imported without `FORGE_RUN_ID` (e.g. tests).
 */
export async function bootstrapForgeWorkflow(
  run: (ctx: ForgeRunContext) => Promise<void>,
): Promise<void> {
  const runId = process.env.FORGE_RUN_ID
  if (!runId) return

  const goal = process.env.FORGE_GOAL ?? ''
  const abortController = new AbortController()
  process.on('SIGTERM', () => abortController.abort())

  const reporter = createForgeReporter(runId)

  try {
    await run({ runId, goal, abortSignal: abortController.signal, reporter })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workflow failed'
    reporter.fail(message)
    process.exit(1)
  }
}
