import { afterEach, describe, expect, it, vi } from 'vitest'
import { runRegistry } from '../src/runs/registry.js'
import { startRun } from '../src/runs/service.js'
import { resolveWorkflowPath } from '../src/workflows/paths.js'

describe('workflow subprocess runner', () => {
  const stubWorkflowPath = resolveWorkflowPath('workflows/test-stub.ts')

  afterEach(() => {
    runRegistry.reset()
  })

  it('executes a workflow file and streams trace events', async () => {
    const started = await startRun({
      goal: 'Stub goal',
      workflowPath: stubWorkflowPath,
    })
    expect(started.ok).toBe(true)
    if (!started.ok) return

    await vi.waitFor(
      () => {
        const run = runRegistry.get(started.runId)
        expect(run?.toSnapshot().status).toBe('completed')
      },
      { timeout: 5000 },
    )

    const run = runRegistry.get(started.runId)
    expect(run?.toSnapshot()).toMatchObject({
      status: 'completed',
      goal: 'Stub goal',
      workflowPath: stubWorkflowPath,
      tasks: [{ id: 't1', title: 'Stub task', status: 'completed' }],
    })

    const trace = run?.traceSnapshot().lines ?? []
    expect(trace.some((line) => line.message.includes('Tool echo'))).toBe(true)
    expect(trace.some((line) => line.message.includes('hello'))).toBe(true)
  })
})
