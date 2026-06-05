import { describe, expect, it } from 'vitest'
import { assessRunCompletion } from '@oma-forge/shared'
import { RunSession } from '../src/runs/session.js'

describe('assessRunCompletion', () => {
  it('flags success with no tasks, trace, or tokens', () => {
    const health = assessRunCompletion(
      {
        success: true,
        agentResults: new Map(),
        totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
      },
      0,
    )
    expect(health.ok).toBe(false)
    expect(health.issue).toBe('empty_output')
  })

  it('allows plan-only success without tasks', () => {
    const health = assessRunCompletion(
      {
        success: true,
        planOnly: true,
        agentResults: new Map(),
        totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
      },
      0,
    )
    expect(health.ok).toBe(true)
  })

  it('allows honest failure without extra scrutiny', () => {
    const health = assessRunCompletion(
      {
        success: false,
        agentResults: new Map(),
        totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
      },
      0,
    )
    expect(health.ok).toBe(true)
  })
})

describe('RunSession finish health', () => {
  it('downgrades empty success to failed with health', () => {
    const run = new RunSession('run-1', 'Quiet exit')
    run.finish({
      success: true,
      agentResults: new Map(),
      totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
    })

    const snapshot = run.toSnapshot()
    expect(snapshot.status).toBe('failed')
    expect(snapshot.health?.ok).toBe(false)
    expect(snapshot.health?.issue).toBe('empty_output')
  })
})
