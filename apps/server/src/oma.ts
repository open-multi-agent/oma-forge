import { OpenMultiAgent } from '@open-multi-agent/core'
import { eventHub } from './events/hub.js'

/** Shared OMA Core orchestrator for the Forge local API. */
export const oma = new OpenMultiAgent({
  onProgress: (event) => eventHub.publishProgress(event),
})
