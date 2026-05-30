import type { TaskExecutionRecord } from './oma.js'
import type { ForgeTraceLine } from './trace.js'
import { COORDINATOR_AGENT } from './coordinator.js'

/** Whether a trace line belongs to the given DAG task / agent node. */
export function traceLineMatchesTask(
  line: ForgeTraceLine,
  task: TaskExecutionRecord,
): boolean {
  if (line.agent === COORDINATOR_AGENT && line.taskId === undefined) {
    return false
  }
  if (line.taskId !== undefined) {
    return line.taskId === task.id
  }
  if (line.agent !== undefined && task.assignee !== undefined) {
    return line.agent === task.assignee
  }
  return false
}

export function filterTraceLinesForTask(
  lines: readonly ForgeTraceLine[],
  task: TaskExecutionRecord,
): ForgeTraceLine[] {
  return lines.filter((line) => traceLineMatchesTask(line, task))
}
