import type { FastifyPluginAsync } from 'fastify'
import { eventHub, type ForgeEvent } from '../events/hub.js'

const HEARTBEAT_MS = 30_000

function writeSse(reply: import('fastify').FastifyReply, event: ForgeEvent): void {
  reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
}

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/events', async (request, reply) => {
    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    writeSse(reply, { type: 'connected', data: { ok: true } })

    const unsubscribe = eventHub.subscribe((event) => writeSse(reply, event))

    const heartbeat = setInterval(() => {
      reply.raw.write(': ping\n\n')
    }, HEARTBEAT_MS)

    request.raw.on('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
    })
  })
}
