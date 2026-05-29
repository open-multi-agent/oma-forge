import { loadEnvFile } from './load-env.js'
import { buildApp } from './app.js'

loadEnvFile()

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'

const app = await buildApp({ logger: true })

try {
  await app.listen({ port: PORT, host: HOST })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
