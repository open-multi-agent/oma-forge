import {
  DEFAULT_RUN_GOAL,
  parseRunStallMs,
  unhealthyRunHealth,
} from '@oma-forge/shared'
import { eventHub } from '../events/hub.js'
import { applyForgeWorkflowEvent } from './event-bridge.js'
import { runRegistry } from './registry.js'
import type { RunSession } from './session.js'
import { createRunWatchdog } from './watchdog.js'
import { resolveWorkflowPath, workflowPathExists } from '../workflows/paths.js'
import { runWorkflowSubprocess } from '../workflows/runner.js'

export { DEFAULT_RUN_GOAL } from '@oma-forge/shared'

export type StartRunOptions = {
  readonly goal?: string
  readonly workflowPath?: string
  /** Override stall watchdog (ms); defaults to {@link parseRunStallMs}. */
  readonly stallMs?: number
  readonly runWorkflow?: (
    options: import('../workflows/runner.js').RunWorkflowSubprocessOptions,
  ) => Promise<import('../workflows/runner.js').RunWorkflowSubprocessResult>
}

function publishSnapshot(session: RunSession): void {
  eventHub.publishSnapshot(session.toSnapshot())
}

function appendStderrTrace(session: RunSession, line: string): void {
  session.touchActivity()
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
  const watchdog = createRunWatchdog(session, () => {
    if (session.isTerminal()) return
    session.cancel()
    session.fail(
      unhealthyRunHealth(
        'stall_timeout',
        `No workflow activity for ${Math.round(parseRunStallMs() / 1000)}s — run may be hung.`,
      ),
    )
    publishSnapshot(session)
  }, options.stallMs)

  void runWorkflow({
    runId: session.id,
    goal,
    workflowPath,
    abortSignal: session.abortSignal,
    onEvent: (event) => {
      watchdog.reset()
      if (applyForgeWorkflowEvent(session, event)) {
        finishedByEvent = true
      }
    },
    onStderrLine: (line) => appendStderrTrace(session, line),
  })
    .then(({ exitCode, signal }) => {
      watchdog.stop()
      if (session.abortSignal.aborted || signal === 'SIGTERM') {
        if (!session.isTerminal()) session.cancel()
      } else if (!finishedByEvent && !session.isTerminal()) {
        const detail =
          exitCode === 0
            ? 'Workflow process exited without sending a result.'
            : `Workflow process exited with code ${exitCode ?? 'unknown'}.`
        session.fail(unhealthyRunHealth('no_result', detail))
      }
      publishSnapshot(session)
    })
    .catch(() => {
      watchdog.stop()
      if (!session.isTerminal()) {
        session.fail(unhealthyRunHealth('no_result', 'Workflow subprocess failed to start or crashed.'))
      }
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
