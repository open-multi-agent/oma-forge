import type { FastifyPluginAsync } from 'fastify'
import { currentRun } from '../runs/state.js'
import { DEFAULT_RUN_GOAL, startRun } from '../runs/service.js'
import { traceLog } from '../runs/trace-log.js'

type StartRunBody = {
  readonly goal?: string
}

export const runsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/runs/current', async () => currentRun.toSnapshot())

  fastify.get('/api/runs/trace', async () => traceLog.toSnapshot())

  fastify.post<{ Body: StartRunBody }>('/api/runs', async (request, reply) => {
    const goal = request.body?.goal
    if (goal !== undefined && typeof goal !== 'string') {
      return reply.status(400).send({ ok: false, error: 'invalid_goal' })
    }
    if (goal !== undefined && goal.trim().length === 0) {
      return reply.status(400).send({ ok: false, error: 'empty_goal' })
    }

    const result = await startRun({ goal })
    if (!result.ok) {
      return reply.status(409).send({ ok: false, error: result.error })
    }

    return reply.status(202).send({
      ok: true,
      goal: goal?.trim() || DEFAULT_RUN_GOAL,
    })
  })
}
