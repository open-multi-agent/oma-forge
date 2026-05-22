import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { eventHub } from '../src/events/hub.js'

describe('GET /api/events (SSE)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  let baseUrl: string

  beforeEach(async () => {
    app = await buildApp()
    await app.listen({ port: 0, host: '127.0.0.1' })
    const address = app.server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterEach(async () => {
    await app.close()
  })

  it('streams a connected event with text/event-stream', async () => {
    const response = await fetch(`${baseUrl}/api/events`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    const { value } = await reader.read()
    const chunk = decoder.decode(value)

    expect(chunk).toContain('"type":"connected"')
    await reader.cancel()
  })

  it('forwards hub progress events to subscribers', async () => {
    const response = await fetch(`${baseUrl}/api/events`)
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    // Consume connected event
    await reader.read()

    eventHub.publishProgress({ type: 'task_complete', task: 'scaffold-tests' })

    const { value } = await reader.read()
    const chunk = decoder.decode(value)

    expect(chunk).toContain('"type":"progress"')
    expect(chunk).toContain('task_complete')
    expect(chunk).toContain('scaffold-tests')

    await reader.cancel()
  })

  it('forwards run snapshot events to subscribers', async () => {
    const response = await fetch(`${baseUrl}/api/events`)
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    await reader.read()

    eventHub.publishSnapshot({
      status: 'running',
      goal: 'SSE goal',
      tasks: [{ id: 't1', title: 'Task', status: 'in_progress', dependsOn: [] }],
    })

    const { value } = await reader.read()
    const chunk = decoder.decode(value)

    expect(chunk).toContain('"type":"run_snapshot"')
    expect(chunk).toContain('SSE goal')
    expect(chunk).toContain('in_progress')

    await reader.cancel()
  })
})
