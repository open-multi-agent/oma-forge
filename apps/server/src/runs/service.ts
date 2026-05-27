import { DEFAULT_RUN_GOAL } from '@oma-forge/shared'
import type { Team, TeamRunResult } from '@oma-forge/shared'
import { eventHub } from '../events/hub.js'
import { oma } from '../oma.js'
import { forgeDemoTeam } from './demo-team.js'
import { runRegistry } from './registry.js'
import type { RunSession } from './session.js'

export { DEFAULT_RUN_GOAL } from '@oma-forge/shared'

export type StartRunOptions = {
  readonly goal?: string
  readonly team?: Team
  readonly runTeam?: (
    team: Team,
    goal: string,
    options: { readonly abortSignal: AbortSignal },
  ) => Promise<TeamRunResult>
}

function publishSnapshot(session: RunSession): void {
  eventHub.publishSnapshot(session.toSnapshot())
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'))
  )
}

export async function startRun(options: StartRunOptions = {}): Promise<
  | { readonly ok: true; readonly runId: string; readonly goal: string }
  | { readonly ok: false; readonly error: 'run_in_progress'; readonly activeRunId: string }
> {
  const goal = options.goal?.trim() || DEFAULT_RUN_GOAL
  const created = runRegistry.create(goal)
  if (!created.ok) {
    return { ok: false, error: created.error, activeRunId: created.activeRunId }
  }

  const session = created.session
  const team = options.team ?? forgeDemoTeam
  const runTeam =
    options.runTeam ??
    ((t, g, opts) => oma.runTeam(t, g, { abortSignal: opts.abortSignal }))

  publishSnapshot(session)

  void runTeam(team, goal, { abortSignal: session.abortSignal })
    .then((result) => {
      if (session.abortSignal.aborted) {
        if (!session.isTerminal()) session.cancel()
      } else {
        session.finish(result)
      }
      publishSnapshot(session)
    })
    .catch((error: unknown) => {
      if (isAbortError(error) || session.abortSignal.aborted) {
        if (!session.isTerminal()) session.cancel()
      } else {
        session.fail()
      }
      publishSnapshot(session)
    })

  return { ok: true, runId: session.id, goal }
}

export function cancelRun(runId: string): import('./registry.js').CancelRunResult {
  const result = runRegistry.cancel(runId)
  if (result.ok) {
    const session = runRegistry.get(runId)
    if (session) publishSnapshot(session)
  }
  return result
}
