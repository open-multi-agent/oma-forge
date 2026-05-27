import { OpenMultiAgent } from '@open-multi-agent/core'
import { eventHub } from './events/hub.js'
import {
  formatProgressEvent,
  formatStreamEvent,
  formatTraceEvent,
} from './runs/format-trace.js'
import { runRegistry } from './runs/registry.js'
import type { ForgeTraceLine } from '@oma-forge/shared'

function publishTraceLine(session: import('./runs/session.js').RunSession, entry: ForgeTraceLine | null): void {
  if (!entry) return
  session.appendTrace(entry)
  eventHub.publishTraceLine(entry)
}

function getActiveSession() {
  const session = runRegistry.getActive()
  if (!session?.isRunning()) return null
  return session
}

/** Shared OMA Core orchestrator for the Forge local API. */
export const oma = new OpenMultiAgent({
  onProgress: (event) => {
    const session = getActiveSession()
    if (!session) return

    publishTraceLine(session, formatProgressEvent(session.id, event))
    session.applyProgress(event)
    eventHub.publishProgress(event)
    eventHub.publishSnapshot(session.toSnapshot())
  },
  onPlanReady: async (tasks) => {
    const session = getActiveSession()
    if (!session) return true

    session.setPlan(tasks)
    eventHub.publishSnapshot(session.toSnapshot())
    return true
  },
  onTrace: (event) => {
    const session = getActiveSession()
    if (!session) return

    publishTraceLine(session, formatTraceEvent(session.id, event))
  },
  onAgentStream: (agentName, event) => {
    const session = getActiveSession()
    if (!session) return

    publishTraceLine(session, formatStreamEvent(session.id, agentName, event))
  },
})
