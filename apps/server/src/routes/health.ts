import type { FastifyPluginAsync } from 'fastify'
import { resolveDefaultWorkflowPath } from '../workflows/paths.js'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async () => ({
    ok: true,
    mode: 'workflow-runner',
    runtime: '@open-multi-agent/core',
    defaultWorkflowPath: resolveDefaultWorkflowPath(),
  }))
}
