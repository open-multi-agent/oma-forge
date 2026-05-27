import { afterEach, describe, expect, it } from 'vitest'
import { RunRegistry } from '../src/runs/registry.js'

describe('RunRegistry', () => {
  const registry = new RunRegistry()

  afterEach(() => {
    registry.reset()
  })

  it('lists runs newest first after multiple completed runs', () => {
    const first = registry.create('First')
    expect(first.ok).toBe(true)
    if (first.ok) first.session.finish({ success: true, agentResults: new Map(), totalTokenUsage: { input_tokens: 0, output_tokens: 0 } })

    const second = registry.create('Second')
    expect(second.ok).toBe(true)

    const summaries = registry.listSummaries()
    expect(summaries).toHaveLength(2)
    expect(summaries[0]?.goal).toBe('Second')
    expect(summaries[1]?.goal).toBe('First')
  })

  it('exposes current snapshot from most recent run when idle', () => {
    const created = registry.create('Done')
    expect(created.ok).toBe(true)
    if (!created.ok) return
    created.session.finish({
      success: true,
      goal: 'Done',
      tasks: [],
      agentResults: new Map(),
      totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
    })

    expect(registry.currentSnapshot()).toMatchObject({
      id: created.session.id,
      status: 'completed',
      goal: 'Done',
    })
  })
})
