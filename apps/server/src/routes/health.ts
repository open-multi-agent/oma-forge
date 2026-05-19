import type { FastifyPluginAsync } from 'fastify'
import { oma } from '../oma.js'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async () => ({
    ok: true,
    runtime: '@open-multi-agent/core',
    orchestrator: oma.getStatus(),
  }))
}
