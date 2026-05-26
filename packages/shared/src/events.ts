import type { OrchestratorEvent } from '@open-multi-agent/core'
import type { RunSnapshot } from './run.js'
import type { ForgeTraceLine } from './trace.js'

export type ForgeEvent =
  | { readonly type: 'connected'; readonly data: { readonly ok: true } }
  | { readonly type: 'progress'; readonly data: OrchestratorEvent }
  | { readonly type: 'run_snapshot'; readonly data: RunSnapshot }
  | { readonly type: 'trace_line'; readonly data: ForgeTraceLine }

export function parseForgeEvent(raw: string): ForgeEvent | null {
  try {
    return JSON.parse(raw) as ForgeEvent
  } catch {
    return null
  }
}
