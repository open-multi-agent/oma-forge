import { describe, expect, it } from 'vitest'
import { RunSession } from '../src/runs/session.js'

describe('RunSession', () => {
  it('begins in running with an empty task list', () => {
    const run = new RunSession('run-1', 'Ship the feature')
    expect(run.toSnapshot()).toMatchObject({
      id: 'run-1',
      status: 'running',
      goal: 'Ship the feature',
      tasks: [],
    })
  })

  it('maps coordinator plan tasks to records', () => {
    const run = new RunSession('run-1', 'Ship the feature')
    run.setPlan([
      {
        id: 't1',
        title: 'Design',
        status: 'pending',
        description: 'Design the API',
        dependsOn: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    expect(run.toSnapshot()).toMatchObject({
      status: 'running',
      goal: 'Ship the feature',
      tasks: [{ id: 't1', title: 'Design', status: 'pending', dependsOn: [] }],
    })
  })

  it('updates task status from progress events', () => {
    const run = new RunSession('run-1', 'Run tests')
    run.setPlan([
      {
        id: 't1',
        title: 'Test',
        status: 'pending',
        description: 'Run unit tests',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    run.applyProgress({ type: 'task_start', task: 't1' })
    expect(run.toSnapshot().tasks.find((t) => t.id === 't1')?.status).toBe('in_progress')

    run.applyProgress({ type: 'task_complete', task: 't1' })
    expect(run.toSnapshot().tasks.find((t) => t.id === 't1')?.status).toBe('completed')
  })

  it('creates tasks on task_start when no plan was received', () => {
    const run = new RunSession('run-1', 'Live run')
    run.applyProgress({
      type: 'task_start',
      task: 't1',
      agent: 'researcher',
      data: {
        id: 't1',
        title: 'Research topic',
        status: 'in_progress',
        description: 'Research',
        assignee: 'researcher',
        dependsOn: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(run.toSnapshot().tasks).toEqual([
      {
        id: 't1',
        title: 'Research topic',
        assignee: 'researcher',
        status: 'in_progress',
        dependsOn: [],
      },
    ])
  })

  it('does not add coordinator or short-circuit agents to the DAG snapshot', () => {
    const run = new RunSession('run-1', 'Ship the feature')
    run.applyProgress({ type: 'agent_start', agent: 'coordinator' })
    run.applyProgress({
      type: 'agent_start',
      agent: 'researcher',
      data: { phase: 'short-circuit', goal: 'Quick ask' },
    })
    expect(run.toSnapshot().tasks).toEqual([])

    run.setPlan([
      {
        id: 't1',
        title: 'Research',
        status: 'pending',
        description: 'Research',
        dependsOn: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    expect(run.toSnapshot().tasks).toEqual([
      { id: 't1', title: 'Research', status: 'pending', dependsOn: [] },
    ])
  })

  it('uses dependsOn from oma-core task_start payload only', () => {
    const run = new RunSession('run-1', 'Goal')
    run.setPlan([
      {
        id: 't1',
        title: 'Research',
        status: 'pending',
        description: 'Research',
        dependsOn: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        title: 'Summarize',
        status: 'pending',
        description: 'Summarize',
        dependsOn: ['t1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    run.applyProgress({
      type: 'task_start',
      task: 't2',
      agent: 'summary-writer',
      data: {
        id: 't2',
        title: 'Summarize',
        status: 'in_progress',
        description: 'Summarize',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(run.toSnapshot().tasks[1]?.dependsOn).toEqual([])
  })

  it('uses dependsOn from oma-core final result only', () => {
    const run = new RunSession('run-1', 'Goal')
    run.setPlan([
      {
        id: 't1',
        title: 'Research',
        status: 'completed',
        description: 'Research',
        dependsOn: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        title: 'Summarize',
        status: 'failed',
        description: 'Summarize',
        dependsOn: ['t1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    run.finish({
      success: false,
      tasks: [
        { id: 't1', title: 'Research', status: 'completed', dependsOn: [] },
        { id: 't2', title: 'Summarize', status: 'failed' },
      ],
      agentResults: new Map(),
      totalTokenUsage: { input_tokens: 1, output_tokens: 0 },
    })

    expect(run.toSnapshot().tasks[1]?.dependsOn).toEqual([])
  })

  it('finishes with team run result tasks and metrics', () => {
    const run = new RunSession('run-1', 'Goal')
    run.finish({
      success: true,
      goal: 'Goal',
      tasks: [
        {
          id: 't1',
          title: 'Done',
          status: 'completed',
          dependsOn: [],
          metrics: {
            startMs: 0,
            endMs: 1,
            durationMs: 1,
            tokenUsage: { input_tokens: 1, output_tokens: 2 },
            toolCalls: [],
          },
        },
      ],
      agentResults: new Map(),
      totalTokenUsage: { input_tokens: 1, output_tokens: 2 },
    })

    const snapshot = run.toSnapshot()
    expect(snapshot.status).toBe('completed')
    expect(snapshot.finishedAt).toBeDefined()
    expect(snapshot.tasks[0]?.metrics).toBeDefined()
  })

  it('cancels a running session', () => {
    const run = new RunSession('run-1', 'Stop me')
    run.cancel()
    expect(run.toSnapshot().status).toBe('cancelled')
    expect(run.abortSignal.aborted).toBe(true)
  })
})
