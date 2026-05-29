import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveRepoRoot } from './workflows/paths.js'

/** Loads repo-root `.env` into `process.env` (does not override existing vars). */
export function loadEnvFile(): void {
  const path = join(resolveRepoRoot(), '.env')
  if (!existsSync(path)) return

  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    if (!key || key in process.env) continue

    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}
