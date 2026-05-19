import type { OrchestratorEvent } from '@open-multi-agent/core'

export type ForgeEvent =
  | { readonly type: 'connected'; readonly data: { readonly ok: true } }
  | { readonly type: 'progress'; readonly data: OrchestratorEvent }

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

  publish(event: ForgeEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

export const eventHub = new EventHub()
