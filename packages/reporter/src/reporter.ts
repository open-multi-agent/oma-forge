import type {
  OrchestratorEvent,
  StreamEvent,
  Task,
  TeamRunResult,
  TraceEvent,
} from '@open-multi-agent/core'
import {
  encodeForgeEvent,
  serializeTeamRunResult,
  type ForgePlanTask,
  type ForgeWorkflowEvent,
} from '@oma-forge/shared'

function planTaskFromTask(task: Task): ForgePlanTask {
  return {
    id: task.id,
    title: task.title,
    assignee: task.assignee,
    status: task.status,
    dependsOn: task.dependsOn,
  }
}

function emit(event: ForgeWorkflowEvent): void {
  process.stdout.write(`${encodeForgeEvent(event)}\n`)
}

export type ForgeReporter = {
  readonly onProgress: (event: OrchestratorEvent) => void
  readonly onTrace: (event: TraceEvent) => void | Promise<void>
  readonly onPlanReady: (tasks: readonly Task[]) => Promise<boolean>
  readonly onAgentStream: (agentName: string, event: StreamEvent) => void
  finish(result: TeamRunResult): void
  fail(message: string): void
}

/** Forwards OMA callbacks to Forge via stdout NDJSON. */
export function createForgeReporter(runId: string): ForgeReporter {
  return {
    onProgress(event) {
      emit({ type: 'progress', runId, data: event })
    },
    onTrace(event) {
      emit({ type: 'trace', runId, data: event })
    },
    async onPlanReady(tasks) {
      emit({
        type: 'plan',
        runId,
        data: { tasks: tasks.map(planTaskFromTask) },
      })
      return true
    },
    onAgentStream(agent, event) {
      emit({ type: 'agent_stream', runId, agent, data: event })
    },
    finish(result) {
      emit({ type: 'result', runId, data: serializeTeamRunResult(result) })
    },
    fail(message) {
      emit({ type: 'error', runId, data: { message } })
    },
  }
}
