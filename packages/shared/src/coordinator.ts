import type { ForgeTraceLine } from './trace.js'

export const COORDINATOR_TASK_ID = 'coordinator'
export const COORDINATOR_AGENT = 'coordinator'

/** Whether a trace line belongs to the coordinator planning phase (not worker tasks). */
export function traceLineMatchesCoordinator(line: ForgeTraceLine): boolean {
  if (line.taskId !== undefined) {
    return line.taskId === COORDINATOR_TASK_ID
  }
  if (line.agent !== undefined) {
    return line.agent === COORDINATOR_AGENT
  }
  return /^Plan (ready|published):/i.test(line.message)
}

export function filterTraceLinesForCoordinator(
  lines: readonly ForgeTraceLine[],
): ForgeTraceLine[] {
  return lines.filter(traceLineMatchesCoordinator)
}
