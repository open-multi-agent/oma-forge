import { describe, expect, it, vi } from 'vitest'
import { EventHub } from '../src/events/hub.js'

describe('EventHub', () => {
  it('notifies subscribers on publish', () => {
    const hub = new EventHub()
    const listener = vi.fn()

    hub.subscribe(listener)
    hub.publish({ type: 'connected', data: { ok: true } })

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith({ type: 'connected', data: { ok: true } })
  })

  it('stops notifying after unsubscribe', () => {
    const hub = new EventHub()
    const listener = vi.fn()

    const unsubscribe = hub.subscribe(listener)
    unsubscribe()
    hub.publish({ type: 'connected', data: { ok: true } })

    expect(listener).not.toHaveBeenCalled()
  })

  it('wraps OMA progress events', () => {
    const hub = new EventHub()
    const listener = vi.fn()

    hub.subscribe(listener)
    hub.publishProgress({ type: 'task_start', task: 'design-api' })

    expect(listener).toHaveBeenCalledWith({
      type: 'progress',
      data: { type: 'task_start', task: 'design-api' },
    })
  })
})
