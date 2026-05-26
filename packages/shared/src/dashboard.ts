import type { TeamRunResult } from '@open-multi-agent/core'
import type { RunSnapshot } from './run.js'

/** Subset of {@link TeamRunResult} used by the Forge DAG dashboard UI. */
export type ForgeDashboardRun = Pick<TeamRunResult, 'goal' | 'tasks'>

export function runSnapshotToDashboard(snapshot: RunSnapshot): ForgeDashboardRun {
  return {
    goal: snapshot.goal ?? '',
    tasks: snapshot.tasks,
  }
}

export function emptyDashboardRun(): ForgeDashboardRun {
  return { goal: '', tasks: [] }
}
