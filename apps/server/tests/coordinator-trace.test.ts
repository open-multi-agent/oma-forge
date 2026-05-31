import { describe, expect, it } from 'vitest'
import { filterTraceLinesForCoordinator, filterTraceLinesForTask } from '@oma-forge/shared'

describe('filterTraceLinesForCoordinator', () => {
  it('keeps coordinator agent and plan messages', () => {
    const lines = [
      {
        runId: 'r1',
        at: 1,
        level: 'stream' as const,
        agent: 'researcher',
        message: 'Finding sources…',
      },
      {
        runId: 'r1',
        at: 2,
        level: 'info' as const,
        agent: 'coordinator',
        message: 'Plan ready: 2 tasks (approved)',
      },
    ]
    expect(filterTraceLinesForCoordinator(lines).map((l) => l.message)).toEqual([
      'Plan ready: 2 tasks (approved)',
    ])
  })
})

describe('filterTraceLinesForTask', () => {
  it('excludes coordinator traces from worker nodes', () => {
    const worker = {
      id: 't1',
      title: 'Research',
      assignee: 'researcher',
      status: 'in_progress' as const,
      dependsOn: [],
    }
    const lines = [
      {
        runId: 'r1',
        at: 1,
        level: 'info' as const,
        agent: 'coordinator',
        message: 'Agent started: coordinator',
      },
      {
        runId: 'r1',
        at: 2,
        level: 'stream' as const,
        agent: 'researcher',
        taskId: 't1',
        message: 'Hello',
      },
    ]
    expect(filterTraceLinesForTask(lines, worker).map((l) => l.message)).toEqual(['Hello'])
  })
})