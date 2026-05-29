import type { FastifyPluginAsync } from 'fastify'
import { DEFAULT_RUN_GOAL, cancelRun, startRun } from '../runs/service.js'
import { runRegistry } from '../runs/registry.js'
import { resolveDefaultWorkflowPath } from '../workflows/paths.js'

type StartRunBody = {
  readonly goal?: string
  readonly workflowPath?: string
}

export const runsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/workflow', async () => ({
    defaultWorkflowPath: resolveDefaultWorkflowPath(),
    defaultGoal: DEFAULT_RUN_GOAL,
  }))

  fastify.get('/api/runs', async () => ({
    runs: runRegistry.listSummaries(),
    activeRunId: runRegistry.getActive()?.id ?? null,
  }))

  fastify.get('/api/runs/current', async () => runRegistry.currentSnapshot())

  fastify.get('/api/runs/trace', async () => {
    const run = runRegistry.getActive() ?? runRegistry.getMostRecent()
    return run?.traceSnapshot() ?? { lines: [] }
  })

  fastify.get<{ Params: { id: string } }>('/api/runs/:id', async (request, reply) => {
    const run = runRegistry.get(request.params.id)
    if (!run) {
      return reply.status(404).send({ ok: false, error: 'not_found' })
    }
    return run.toSnapshot()
  })

  fastify.get<{ Params: { id: string } }>('/api/runs/:id/trace', async (request, reply) => {
    const run = runRegistry.get(request.params.id)
    if (!run) {
      return reply.status(404).send({ ok: false, error: 'not_found' })
    }
    return run.traceSnapshot()
  })

  fastify.post<{ Body: StartRunBody }>('/api/runs', async (request, reply) => {
    const goal = request.body?.goal
    const workflowPath = request.body?.workflowPath

    if (goal !== undefined && typeof goal !== 'string') {
      return reply.status(400).send({ ok: false, error: 'invalid_goal' })
    }
    if (goal !== undefined && goal.trim().length === 0) {
      return reply.status(400).send({ ok: false, error: 'empty_goal' })
    }
    if (workflowPath !== undefined && typeof workflowPath !== 'string') {
      return reply.status(400).send({ ok: false, error: 'invalid_workflow_path' })
    }
    if (workflowPath !== undefined && workflowPath.trim().length === 0) {
      return reply.status(400).send({ ok: false, error: 'empty_workflow_path' })
    }

    const result = await startRun({ goal, workflowPath })
    if (!result.ok) {
      if (result.error === 'workflow_not_found') {
        return reply.status(400).send({
          ok: false,
          error: result.error,
          workflowPath: result.workflowPath,
        })
      }
      return reply.status(409).send({
        ok: false,
        error: result.error,
        activeRunId: result.activeRunId,
      })
    }

    return reply.status(202).send({
      ok: true,
      runId: result.runId,
      goal: result.goal,
      workflowPath: result.workflowPath,
    })
  })

  fastify.post<{ Params: { id: string } }>(
    '/api/runs/:id/cancel',
    async (request, reply) => {
      const result = cancelRun(request.params.id)
      if (!result.ok) {
        const status = result.error === 'not_found' ? 404 : 409
        return reply.status(status).send({ ok: false, error: result.error })
      }
      return { ok: true }
    },
  )
}
