import { OpenMultiAgent } from '@open-multi-agent/core'
import { eventHub } from './events/hub.js'
import { currentRun } from './runs/state.js'

/** Shared OMA Core orchestrator for the Forge local API. */
export const oma = new OpenMultiAgent({
  onProgress: (event) => {
    currentRun.applyProgress(event)
    eventHub.publishProgress(event)
    eventHub.publishSnapshot(currentRun.toSnapshot())
  },
  onPlanReady: async (tasks) => {
    currentRun.setPlan(tasks)
    eventHub.publishSnapshot(currentRun.toSnapshot())
    return true
  },
})
