import { getForgeReporter } from './forge-env.js'
import { isTeamRunResult } from './hooks.js'

/**
 * Runs `main` inside a Forge subprocess (when `FORGE_RUN_ID` is set).
 * Finishes the run from the return value when it looks like a {@link TeamRunResult}.
 */
export async function runForgeWorkflow(main: () => Promise<unknown>): Promise<void> {
  if (!process.env.FORGE_RUN_ID) return

  getForgeReporter()

  try {
    const result = await main()
    if (isTeamRunResult(result)) {
      getForgeReporter().finish(result)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workflow failed'
    getForgeReporter().fail(message)
    process.exit(1)
  }
}
