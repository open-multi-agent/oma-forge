import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../src/app.js'
import { currentRun } from '../src/runs/state.js'
import { traceLog } from '../src/runs/trace-log.js'
import * as runService from '../src/runs/service.js'

describe('runs API', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    currentRun.reset()
    traceLog.clear()
    app = await buildApp()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    currentRun.reset()
    traceLog.clear()
    await app.close()
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

  it('POST /api/runs starts a run and returns 202', async () => {
    vi.spyOn(runService, 'startRun').mockResolvedValue({ ok: true })

    const response = await app.inject({
      method: 'POST',
      url: '/api/runs',
      payload: { goal: 'Test goal' },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({ ok: true, goal: 'Test goal' })
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
    currentRun.begin('Busy')

    const response = await app.inject({
      method: 'POST',
      url: '/api/runs',
      payload: {},
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ ok: false, error: 'run_in_progress' })
  })
})
