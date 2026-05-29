import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'

describe('GET /api/health', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  afterEach(async () => {
    await app?.close()
  })

  it('returns workflow runner status', async () => {
    app = await buildApp()
    const response = await app.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.ok).toBe(true)
    expect(body.mode).toBe('workflow-runner')
    expect(body.runtime).toBe('@open-multi-agent/core')
    expect(body.defaultWorkflowPath).toEqual(expect.stringContaining('workflows/demo.ts'))
  })
})
