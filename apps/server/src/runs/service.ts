import { DEFAULT_RUN_GOAL } from '@oma-forge/shared'
import type { Team, TeamRunResult } from '@oma-forge/shared'
import { eventHub } from '../events/hub.js'
import { oma } from '../oma.js'
import { forgeDemoTeam } from './demo-team.js'
import { currentRun } from './state.js'
import { traceLog } from './trace-log.js'

export { DEFAULT_RUN_GOAL } from '@oma-forge/shared'

export type StartRunOptions = {
  readonly goal?: string
  readonly team?: Team
  readonly runTeam?: (team: Team, goal: string) => Promise<TeamRunResult>
}

function publishSnapshot(): void {
  eventHub.publishSnapshot(currentRun.toSnapshot())
}

export async function startRun(options: StartRunOptions = {}): Promise<
  | { readonly ok: true }
  | { readonly ok: false; readonly error: 'run_in_progress' }
> {
  if (currentRun.isRunning()) {
    return { ok: false, error: 'run_in_progress' }
  }

  const goal = options.goal?.trim() || DEFAULT_RUN_GOAL
  const team = options.team ?? forgeDemoTeam
  const runTeam = options.runTeam ?? ((t, g) => oma.runTeam(t, g))

  currentRun.reset()
  traceLog.clear()
  currentRun.begin(goal)
  publishSnapshot()

  void runTeam(team, goal)
    .then((result) => {
      currentRun.finish(result)
      publishSnapshot()
    })
    .catch(() => {
      currentRun.fail()
      publishSnapshot()
    })

  return { ok: true }
}
