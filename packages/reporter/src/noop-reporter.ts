import type { ForgeReporter } from './reporter.js'

const noop = () => {}

/** Used when a workflow file is loaded outside a Forge subprocess. */
export const noopForgeReporter: ForgeReporter = {
  onProgress: noop,
  onTrace: noop,
  onPlanReady: async () => true,
  onAgentStream: noop,
  finish: noop,
  fail: noop,
}
