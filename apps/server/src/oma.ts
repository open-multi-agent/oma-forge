import { OpenMultiAgent } from '@open-multi-agent/core'
import { eventHub } from './events/hub.js'
import {
  formatProgressEvent,
  formatStreamEvent,
  formatTraceEvent,
} from './runs/format-trace.js'
import { currentRun } from './runs/state.js'
import type { ForgeTraceLine } from './runs/trace-types.js'
import { traceLog } from './runs/trace-log.js'

function publishTraceLine(entry: ForgeTraceLine | null): void {
  if (!entry) return
  traceLog.append(entry)
  eventHub.publishTraceLine(entry)
}

/** Shared OMA Core orchestrator for the Forge local API. */
export const oma = new OpenMultiAgent({
  onProgress: (event) => {
    publishTraceLine(formatProgressEvent(event))
    currentRun.applyProgress(event)
    eventHub.publishProgress(event)
    eventHub.publishSnapshot(currentRun.toSnapshot())
  },
  onPlanReady: async (tasks) => {
    currentRun.setPlan(tasks)
    eventHub.publishSnapshot(currentRun.toSnapshot())
    return true
  },
  onTrace: (event) => {
    publishTraceLine(formatTraceEvent(event))
  },
  onAgentStream: (agentName, event) => {
    publishTraceLine(formatStreamEvent(agentName, event))
  },
})
