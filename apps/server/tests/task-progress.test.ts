import { describe, expect, it } from 'vitest'
import {
  applyTaskPatch,
  taskPatchFromProgressEvent,
  taskRecordFromResult,
} from '../src/runs/task-progress.js'

describe('taskPatchFromProgressEvent', () => {
  it('uses full task payload from oma-core on task_start', () => {
    const patch = taskPatchFromProgressEvent({
      type: 'task_start',
      task: 't2',
      agent: 'summary-writer',
      data: {
        id: 't2',
        title: 'Summarize',
        status: 'in_progress',
        description: 'Summarize',
        assignee: 'summary-writer',
        dependsOn: ['t1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(patch).toEqual({
      id: 't2',
      title: 'Summarize',
      assignee: 'summary-writer',
      status: 'in_progress',
      dependsOn: ['t1'],
    })
  })

  it('updates only status on task_complete when payload is an agent result', () => {
    const patch = taskPatchFromProgressEvent({
      type: 'task_complete',
      task: 't1',
      agent: 'researcher',
      data: { success: true, output: 'done', messages: [], tokenUsage: { input_tokens: 1, output_tokens: 1 }, toolCalls: [] },
    })

    expect(patch).toEqual({
      id: 't1',
      assignee: 'researcher',
      status: 'completed',
    })
  })
})

describe('applyTaskPatch', () => {
  it('does not clear dependsOn on status-only updates', () => {
    const next = applyTaskPatch(
      [
        {
          id: 't2',
          title: 'Summarize',
          assignee: 'summary-writer',
          status: 'pending',
          dependsOn: ['t1'],
        },
      ],
      { id: 't2', status: 'completed', assignee: 'summary-writer' },
    )

    expect(next[0]?.dependsOn).toEqual(['t1'])
    expect(next[0]?.status).toBe('completed')
  })

  it('replaces dependsOn when oma-core sends a full task payload', () => {
    const next = applyTaskPatch(
      [
        {
          id: 't2',
          title: 'Summarize',
          status: 'pending',
          dependsOn: ['t1'],
        },
      ],
      {
        id: 't2',
        title: 'Summarize',
        status: 'in_progress',
        dependsOn: [],
      },
    )

    expect(next[0]?.dependsOn).toEqual([])
  })
})

describe('taskRecordFromResult', () => {
  it('uses final task records from oma-core without backfill', () => {
    expect(
      taskRecordFromResult({
        id: 't2',
        title: 'Summarize',
        status: 'failed',
      }),
    ).toEqual({
      id: 't2',
      title: 'Summarize',
      status: 'failed',
      dependsOn: [],
    })
  })
})
