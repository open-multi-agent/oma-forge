import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventHub } from '../src/events/hub.js'
import { startRun } from '../src/runs/service.js'
import { currentRun } from '../src/runs/state.js'

describe('startRun', () => {
  afterEach(() => {
    currentRun.reset()
    vi.restoreAllMocks()
  })

  it('returns run_in_progress when already running', async () => {
    currentRun.begin('Busy')

    const result = await startRun({ goal: 'Another' })

    expect(result).toEqual({ ok: false, error: 'run_in_progress' })
  })

  it('publishes snapshots from running to completed', async () => {
    const snapshots: ReturnType<typeof currentRun.toSnapshot>[] = []
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

    expect(result).toEqual({ ok: true })
    await vi.waitFor(() => expect(runTeam).toHaveBeenCalled())
    await vi.waitFor(() => expect(snapshots.at(-1)?.status).toBe('completed'))

    expect(snapshots[0]?.status).toBe('running')
    expect(snapshots.at(-1)?.goal).toBe('Done')
  })
})
