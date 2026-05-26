import type { OrchestratorEvent } from '@open-multi-agent/core'
import type { ForgeTraceLine } from '../runs/trace-types.js'
import type { RunSnapshot } from '../runs/types.js'

export type ForgeEvent =
  | { readonly type: 'connected'; readonly data: { readonly ok: true } }
  | { readonly type: 'progress'; readonly data: OrchestratorEvent }
  | { readonly type: 'run_snapshot'; readonly data: RunSnapshot }
  | { readonly type: 'trace_line'; readonly data: ForgeTraceLine }

type Listener = (event: ForgeEvent) => void

/** In-process pub/sub for forwarding OMA progress to SSE clients. */
export class EventHub {
  private readonly listeners = new Set<Listener>()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publishProgress(event: OrchestratorEvent): void {
    this.publish({ type: 'progress', data: event })
  }

  publishSnapshot(snapshot: RunSnapshot): void {
    this.publish({ type: 'run_snapshot', data: snapshot })
  }

  publishTraceLine(line: ForgeTraceLine): void {
    this.publish({ type: 'trace_line', data: line })
  }

  publish(event: ForgeEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

export const eventHub = new EventHub()
