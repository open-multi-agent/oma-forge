import { forgeAbortSignal, forgeRunId, getForgeReporter } from './forge-env.js'
import { runForgeWorkflow } from './run-forge.js'
import type { ForgeRunContext } from './types.js'

/**
 * @deprecated Export a default async function instead; Forge runs it via the workflow runner shim.
 */
export async function bootstrapForgeWorkflow(
  run: (ctx: ForgeRunContext) => Promise<void>,
): Promise<void> {
  await runForgeWorkflow(async () => {
    const runId = forgeRunId()
    if (!runId) return
    await run({
      runId,
      goal: process.env.FORGE_GOAL ?? '',
      abortSignal: forgeAbortSignal(),
      reporter: getForgeReporter(),
    })
  })
}
