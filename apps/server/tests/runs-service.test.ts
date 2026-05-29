import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventHub } from '../src/events/hub.js'
import { cancelRun, startRun } from '../src/runs/service.js'
import { runRegistry } from '../src/runs/registry.js'

describe('startRun', () => {
  afterEach(() => {
    runRegistry.reset()
    vi.restoreAllMocks()
  })

  it('returns run_in_progress when already running', async () => {
    const first = await startRun({
      goal: 'Busy',
      runTeam: () => new Promise(() => {}),
      team: {} as import('@open-multi-agent/core').Team,
    })
    expect(first.ok).toBe(true)

    const second = await startRun({ goal: 'Another' })
    expect(second).toMatchObject({ ok: false, error: 'run_in_progress' })
    if (!second.ok) {
      expect(second.activeRunId).toBe(first.runId)
    }
  })

  it('publishes snapshots from running to completed', async () => {
    const snapshots: import('@oma-forge/shared').RunSnapshot[] = []
    vi.spyOn(eventHub, 'publishSnapshot').mockImplementation((snapshot) => {
      snapshots.push(snapshot)
    })

    const runTeam = vi.fn().mockResolvedValue({
      success: true,
      goal: 'Done',
      tasks: [{ id: 'a', title: 'A', status: 'completed', dependsOn: [] }],
      agentResults: new Map(),
      totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
    })

    const result = await startRun({
      goal: 'Live test',
      runTeam,
      team: {} as import('@open-multi-agent/core').Team,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.runId).toBeDefined()
    }
    await vi.waitFor(() => expect(runTeam).toHaveBeenCalled())
    await vi.waitFor(() => expect(snapshots.at(-1)?.status).toBe('completed'))

    expect(snapshots[0]?.status).toBe('running')
    expect(snapshots[0]?.id).toBe(result.ok ? result.runId : undefined)
    expect(snapshots.at(-1)?.goal).toBe('Done')
  })

  it('marks run cancelled when abort signal fires', async () => {
    const runTeam = vi.fn(
      (_team, _goal, options: { abortSignal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.abortSignal.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
          })
        }),
    )

    const started = await startRun({
      goal: 'Cancel me',
      runTeam,
      team: {} as import('@open-multi-agent/core').Team,
    })
    expect(started.ok).toBe(true)
    if (!started.ok) return

    cancelRun(started.runId)
    await vi.waitFor(() => {
      expect(runRegistry.get(started.runId)?.toSnapshot().status).toBe('cancelled')
    })
  })
})
