import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventHub } from '../src/events/hub.js'
import { cancelRun, startRun } from '../src/runs/service.js'
import { runRegistry } from '../src/runs/registry.js'
import { resolveWorkflowPath } from '../src/workflows/paths.js'

describe('startRun', () => {
  const stubWorkflowPath = resolveWorkflowPath('workflows/test-stub.ts')

  afterEach(() => {
    runRegistry.reset()
    vi.restoreAllMocks()
  })

  it('returns workflow_not_found for missing workflow file', async () => {
    const result = await startRun({ workflowPath: 'workflows/does-not-exist.ts' })
    expect(result).toMatchObject({ ok: false, error: 'workflow_not_found' })
  })

  it('returns run_in_progress when already running', async () => {
    const first = await startRun({
      goal: 'Busy',
      workflowPath: stubWorkflowPath,
      runWorkflow: () => new Promise(() => {}),
    })
    expect(first.ok).toBe(true)

    const second = await startRun({ goal: 'Another', workflowPath: stubWorkflowPath })
    expect(second).toMatchObject({ ok: false, error: 'run_in_progress' })
    if (!second.ok) {
      expect(second.activeRunId).toBe(first.ok ? first.runId : undefined)
    }
  })

  it('publishes snapshots from running to completed', async () => {
    const snapshots: import('@oma-forge/shared').RunSnapshot[] = []
    vi.spyOn(eventHub, 'publishSnapshot').mockImplementation((snapshot) => {
      snapshots.push(snapshot)
    })

    const runWorkflow = vi.fn().mockImplementation(async ({ onEvent, runId, goal }) => {
      onEvent({
        type: 'progress',
        runId,
        data: { type: 'task_start', task: 't1', agent: 'worker' },
      })
      onEvent({
        type: 'result',
        runId,
        data: {
          success: true,
          goal,
          tasks: [{ id: 't1', title: 'A', status: 'completed', dependsOn: [] }],
          agentResults: {},
          totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
        },
      })
      return { exitCode: 0, signal: null }
    })

    const result = await startRun({
      goal: 'Live test',
      workflowPath: stubWorkflowPath,
      runWorkflow,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.runId).toBeDefined()
      expect(result.workflowPath).toBe(stubWorkflowPath)
    }
    await vi.waitFor(() => expect(runWorkflow).toHaveBeenCalled())
    await vi.waitFor(() => expect(snapshots.at(-1)?.status).toBe('completed'))

    expect(snapshots[0]?.status).toBe('running')
    expect(snapshots[0]?.id).toBe(result.ok ? result.runId : undefined)
    expect(snapshots.at(-1)?.goal).toBe('Live test')
  })

  it('marks run cancelled when abort signal fires', async () => {
    const runWorkflow = vi.fn(
      (_options: { abortSignal: AbortSignal }) =>
        new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>(
          (resolve) => {
            _options.abortSignal.addEventListener('abort', () => {
              resolve({ exitCode: null, signal: 'SIGTERM' })
            })
          },
        ),
    )

    const started = await startRun({
      goal: 'Cancel me',
      workflowPath: stubWorkflowPath,
      runWorkflow,
    })
    expect(started.ok).toBe(true)
    if (!started.ok) return

    cancelRun(started.runId)
    await vi.waitFor(() => {
      expect(runRegistry.get(started.runId)?.toSnapshot().status).toBe('cancelled')
    })
  })
})
