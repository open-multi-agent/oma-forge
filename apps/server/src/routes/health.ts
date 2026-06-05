import type { FastifyPluginAsync } from 'fastify'
import { parseRunStallMs } from '@oma-forge/shared'
import { resolveDefaultWorkflowPath } from '../workflows/paths.js'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async () => ({
    ok: true,
    mode: 'workflow-runner',
    runtime: '@open-multi-agent/core',
    defaultWorkflowPath: resolveDefaultWorkflowPath(),
    runStallTimeoutMs: parseRunStallMs(),
  }))
}
