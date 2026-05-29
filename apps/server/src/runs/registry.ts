import type { RunSnapshot, RunSummary } from '@oma-forge/shared'
import { RunSession } from './session.js'

const MAX_HISTORY = 100

export type CreateRunResult =
  | { readonly ok: true; readonly session: RunSession }
  | { readonly ok: false; readonly error: 'run_in_progress'; readonly activeRunId: string }

export type CancelRunResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: 'not_found' | 'not_running' }

export class RunRegistry {
  private readonly runs = new Map<string, RunSession>()
  private readonly order: string[] = []
  private activeId: string | null = null

  reset(): void {
    for (const session of this.runs.values()) {
      if (session.isRunning()) session.cancel()
    }
    this.runs.clear()
    this.order.length = 0
    this.activeId = null
  }

  create(goal: string): CreateRunResult {
    const active = this.getActive()
    if (active?.isRunning()) {
      return { ok: false, error: 'run_in_progress', activeRunId: active.id }
    }

    const session = new RunSession(crypto.randomUUID(), goal)
    this.runs.set(session.id, session)
    this.order.unshift(session.id)
    this.activeId = session.id
    this.trimHistory()
    return { ok: true, session }
  }

  get(id: string): RunSession | undefined {
    return this.runs.get(id)
  }

  getActive(): RunSession | null {
    if (!this.activeId) return null
    return this.runs.get(this.activeId) ?? null
  }

  getMostRecent(): RunSession | null {
    const id = this.order[0]
    return id ? (this.runs.get(id) ?? null) : null
  }

  /** Snapshot for “current” view: active run, else most recent, else idle. */
  currentSnapshot(): RunSnapshot {
    const run = this.getActive() ?? this.getMostRecent()
    if (!run) {
      return { status: 'idle', tasks: [] }
    }
    return run.toSnapshot()
  }

  listSummaries(): readonly RunSummary[] {
    return this.order
      .map((id) => this.runs.get(id))
      .filter((run): run is RunSession => run !== undefined)
      .map((run) => run.toSummary())
  }

  cancel(id: string): CancelRunResult {
    const session = this.runs.get(id)
    if (!session) return { ok: false, error: 'not_found' }
    if (!session.isRunning()) return { ok: false, error: 'not_running' }
    session.cancel()
    return { ok: true }
  }

  private trimHistory(): void {
    while (this.order.length > MAX_HISTORY) {
      const removedId = this.order.pop()
      if (!removedId) break
      const removed = this.runs.get(removedId)
      if (removed?.isRunning()) removed.cancel()
      this.runs.delete(removedId)
      if (this.activeId === removedId) {
        this.activeId = this.order[0] ?? null
      }
    }
  }
}

export const runRegistry = new RunRegistry()
