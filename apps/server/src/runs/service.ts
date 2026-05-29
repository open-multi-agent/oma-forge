import { DEFAULT_RUN_GOAL } from '@oma-forge/shared'
import { eventHub } from '../events/hub.js'
import { applyForgeWorkflowEvent } from './event-bridge.js'
import { runRegistry } from './registry.js'
import type { RunSession } from './session.js'
import { resolveWorkflowPath, workflowPathExists } from '../workflows/paths.js'
import { runWorkflowSubprocess } from '../workflows/runner.js'

export { DEFAULT_RUN_GOAL } from '@oma-forge/shared'

export type StartRunOptions = {
  readonly goal?: string
  readonly workflowPath?: string
  readonly runWorkflow?: (
    options: import('../workflows/runner.js').RunWorkflowSubprocessOptions,
  ) => Promise<import('../workflows/runner.js').RunWorkflowSubprocessResult>
}

function publishSnapshot(session: RunSession): void {
  eventHub.publishSnapshot(session.toSnapshot())
}

function appendStderrTrace(session: RunSession, line: string): void {
  session.appendTrace({
    runId: session.id,
    at: Date.now(),
    level: 'warn',
    message: line,
  })
  eventHub.publishTraceLine({
    runId: session.id,
    at: Date.now(),
    level: 'warn',
    message: line,
  })
}

export async function startRun(options: StartRunOptions = {}): Promise<
  | { readonly ok: true; readonly runId: string; readonly goal: string; readonly workflowPath: string }
  | { readonly ok: false; readonly error: 'run_in_progress'; readonly activeRunId: string }
  | { readonly ok: false; readonly error: 'workflow_not_found'; readonly workflowPath: string }
> {
  const goal = options.goal?.trim() || DEFAULT_RUN_GOAL
  const workflowPath = resolveWorkflowPath(options.workflowPath)

  if (!workflowPathExists(workflowPath)) {
    return { ok: false, error: 'workflow_not_found', workflowPath }
  }

  const created = runRegistry.create(goal, workflowPath)
  if (!created.ok) {
    return { ok: false, error: created.error, activeRunId: created.activeRunId }
  }

  const session = created.session
  const runWorkflow = options.runWorkflow ?? runWorkflowSubprocess

  publishSnapshot(session)

  let finishedByEvent = false

  void runWorkflow({
    runId: session.id,
    goal,
    workflowPath,
    abortSignal: session.abortSignal,
    onEvent: (event) => {
      if (applyForgeWorkflowEvent(session, event)) {
        finishedByEvent = true
      }
    },
    onStderrLine: (line) => appendStderrTrace(session, line),
  })
    .then(({ exitCode, signal }) => {
      if (session.abortSignal.aborted || signal === 'SIGTERM') {
        if (!session.isTerminal()) session.cancel()
      } else if (!finishedByEvent) {
        if (exitCode === 0) {
          if (!session.isTerminal()) session.fail()
        } else if (!session.isTerminal()) {
          session.fail()
        }
      }
      publishSnapshot(session)
    })
    .catch(() => {
      if (!session.isTerminal()) session.fail()
      publishSnapshot(session)
    })

  return { ok: true, runId: session.id, goal, workflowPath }
}

export function cancelRun(runId: string): import('./registry.js').CancelRunResult {
  const result = runRegistry.cancel(runId)
  if (result.ok) {
    const session = runRegistry.get(runId)
    if (session) publishSnapshot(session)
  }
  return result
}
