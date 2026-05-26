import { describe, expect, it } from 'vitest'
import {
  formatProgressEvent,
  formatStreamEvent,
  formatTraceEvent,
} from '../src/runs/format-trace.js'

describe('formatProgressEvent', () => {
  it('formats task lifecycle events', () => {
    const line = formatProgressEvent({ type: 'task_start', task: 't1', agent: 'worker' })
    expect(line?.message).toContain('Task started')
    expect(line?.taskId).toBe('t1')
    expect(line?.agent).toBe('worker')
  })
})

describe('formatTraceEvent', () => {
  it('formats tool call traces', () => {
    const line = formatTraceEvent({
      type: 'tool_call',
      runId: 'r1',
      startMs: 0,
      endMs: 1,
      durationMs: 1,
      agent: 'worker',
      taskId: 't1',
      tool: 'read_file',
      isError: false,
      input: {},
      output: 'ok',
    })
    expect(line?.message).toContain('read_file')
    expect(line?.level).toBe('info')
  })

  it('ignores agent_stream trace duplicates', () => {
    expect(
      formatTraceEvent({
        type: 'agent_stream',
        runId: 'r1',
        startMs: 0,
        endMs: 0,
        durationMs: 0,
        agent: 'worker',
        streamType: 'text',
      }),
    ).toBeNull()
  })
})

describe('formatStreamEvent', () => {
  it('formats text stream deltas', () => {
    const line = formatStreamEvent('writer', { type: 'text', data: 'Hello' })
    expect(line?.level).toBe('stream')
    expect(line?.message).toBe('Hello')
    expect(line?.agent).toBe('writer')
  })
})
