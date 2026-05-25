import Fastify, { type FastifyInstance } from 'fastify'
import { eventsRoutes } from './routes/events.js'
import { healthRoutes } from './routes/health.js'
import { runsRoutes } from './routes/runs.js'

export type BuildAppOptions = {
  readonly logger?: boolean
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false })
  await app.register(healthRoutes)
  await app.register(eventsRoutes)
  await app.register(runsRoutes)
  return app
}
