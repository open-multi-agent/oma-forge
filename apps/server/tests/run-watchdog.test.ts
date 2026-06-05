import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventHub } from '../src/events/hub.js'
import { startRun } from '../src/runs/service.js'
import { runRegistry } from '../src/runs/registry.js'
import { createRunWatchdog } from '../src/runs/watchdog.js'
import { resolveWorkflowPath } from '../src/workflows/paths.js'

describe('createRunWatchdog', () => {
  afterEach(() => {
    runRegistry.reset()
    vi.useRealTimers()
  })

  it('fires after the configured stall window', async () => {
    const created = runRegistry.create('Hang')
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const onStall = vi.fn()
    vi.useFakeTimers()
    const watchdog = createRunWatchdog(created.session, onStall, 30)
    await vi.advanceTimersByTimeAsync(29)
    expect(onStall).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2)
    expect(onStall).toHaveBeenCalled()
    watchdog.stop()
    vi.useRealTimers()
  })
})

describe('startRun stall watchdog', () => {
  const stubWorkflowPath = resolveWorkflowPath('workflows/test-stub.ts')

  afterEach(() => {
    runRegistry.reset()
    vi.restoreAllMocks()
  })

  it('fails the run when no workflow events arrive within the stall window', async () => {
    const snapshots: import('@oma-forge/shared').RunSnapshot[] = []
    vi.spyOn(eventHub, 'publishSnapshot').mockImplementation((snapshot) => {
      snapshots.push(snapshot)
    })

    const started = await startRun({
      goal: 'Hang',
      workflowPath: stubWorkflowPath,
      stallMs: 50,
      runWorkflow: () => new Promise(() => {}),
    })
    expect(started.ok).toBe(true)
    if (!started.ok) return

    await vi.waitFor(
      () => {
        const last = snapshots.at(-1)
        expect(last?.status).toBe('failed')
        expect(last?.health?.issue).toBe('stall_timeout')
      },
      { timeout: 2000 },
    )
  })
})
