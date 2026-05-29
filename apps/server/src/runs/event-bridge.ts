import {
  deserializeTeamRunResult,
  type ForgePlanTask,
  type ForgeWorkflowEvent,
} from '@oma-forge/shared'
import { eventHub } from '../events/hub.js'
import {
  formatProgressEvent,
  formatStreamEvent,
  formatTraceEvent,
} from './format-trace.js'
import type { RunSession } from './session.js'

function publishTraceLine(
  session: RunSession,
  entry: import('@oma-forge/shared').ForgeTraceLine | null,
): void {
  if (!entry) return
  session.appendTrace(entry)
  eventHub.publishTraceLine(entry)
}

function publishSnapshot(session: RunSession): void {
  eventHub.publishSnapshot(session.toSnapshot())
}

function planTasksToRecords(tasks: readonly ForgePlanTask[]) {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    assignee: task.assignee,
    status: task.status,
    dependsOn: task.dependsOn ?? [],
  }))
}

/** Applies a workflow subprocess event to the active run session. Returns true when terminal. */
export function applyForgeWorkflowEvent(
  session: RunSession,
  event: ForgeWorkflowEvent,
): boolean {
  if (event.runId !== session.id) return false

  switch (event.type) {
    case 'progress': {
      publishTraceLine(session, formatProgressEvent(session.id, event.data))
      session.applyProgress(event.data)
      eventHub.publishProgress(event.data)
      publishSnapshot(session)
      return false
    }
    case 'trace': {
      publishTraceLine(session, formatTraceEvent(session.id, event.data))
      return false
    }
    case 'plan': {
      session.setPlanRecords(planTasksToRecords(event.data.tasks))
      publishSnapshot(session)
      return false
    }
    case 'agent_stream': {
      publishTraceLine(
        session,
        formatStreamEvent(session.id, event.agent, event.data),
      )
      return false
    }
    case 'result': {
      session.finish(deserializeTeamRunResult(event.data))
      publishSnapshot(session)
      return true
    }
    case 'error': {
      publishTraceLine(session, {
        runId: session.id,
        at: Date.now(),
        level: 'error',
        message: event.data.message,
      })
      session.fail()
      publishSnapshot(session)
      return true
    }
    default:
      return false
  }
}
