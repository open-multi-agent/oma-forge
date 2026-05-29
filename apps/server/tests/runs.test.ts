import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../src/app.js'
import { runRegistry } from '../src/runs/registry.js'
import * as runService from '../src/runs/service.js'

describe('runs API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    runRegistry.reset()
    app = await buildApp()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    runRegistry.reset()
    await app.close()
  })

  it('GET /api/runs returns empty history when idle', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/runs' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ runs: [], activeRunId: null })
  })

  it('GET /api/runs/trace returns empty log when idle', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/runs/trace' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ lines: [] })
  })

  it('GET /api/runs/current returns idle snapshot', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/runs/current' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'idle', tasks: [] })
  })

  it('POST /api/runs starts a run and returns 202 with runId', async () => {
    vi.spyOn(runService, 'startRun').mockResolvedValue({
      ok: true,
      runId: 'run-test-1',
      goal: 'Test goal',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/api/runs',
      payload: { goal: 'Test goal' },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({
      ok: true,
      runId: 'run-test-1',
      goal: 'Test goal',
    })
    expect(runService.startRun).toHaveBeenCalledWith({ goal: 'Test goal' })
  })

  it('POST /api/runs rejects empty goal', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/runs',
      payload: { goal: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ ok: false, error: 'empty_goal' })
  })

  it('POST /api/runs returns 409 when a run is in progress', async () => {
    runRegistry.create('Busy')

    const response = await app.inject({
      method: 'POST',
      url: '/api/runs',
      payload: {},
    })

    expect(response.statusCode).toBe(409)
    const body = response.json() as { ok: boolean; error: string; activeRunId: string }
    expect(body.ok).toBe(false)
    expect(body.error).toBe('run_in_progress')
    expect(body.activeRunId).toBeDefined()
  })

  it('GET /api/runs/:id returns 404 for unknown run', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/runs/missing' })
    expect(response.statusCode).toBe(404)
  })

  it('POST /api/runs/:id/cancel returns 404 for unknown run', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/runs/missing/cancel',
    })
    expect(response.statusCode).toBe(404)
  })
})
