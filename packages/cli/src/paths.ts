import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

export function resolveWorkflowArg(arg: string, cwd: string): string {
  return resolve(isAbsolute(arg) ? arg : join(cwd, arg))
}

export function resolveServerEntry(): string {
  const serverRoot = dirname(require.resolve('@oma-forge/server/package.json'))
  return join(serverRoot, 'dist/index.js')
}

export function resolveWebRoot(): string {
  return dirname(require.resolve('@oma-forge/web/package.json'))
}

export function resolveViteCli(webRoot: string): string {
  const webRequire = createRequire(join(webRoot, 'package.json'))
  const viteRoot = dirname(webRequire.resolve('vite/package.json'))
  return join(viteRoot, 'bin', 'vite.js')
}

export function resolveSharedDist(): string {
  const sharedRoot = dirname(require.resolve('@oma-forge/shared/package.json'))
  return join(sharedRoot, 'dist/index.js')
}

export function resolveReporterDist(): string {
  const reporterRoot = dirname(require.resolve('@oma-forge/reporter/package.json'))
  return join(reporterRoot, 'dist/index.js')
}

/** Monorepo root (for build hint), when CLI is linked from the oma-forge workspace. */
export function resolveForgeMonorepoRoot(): string | undefined {
  try {
    const serverRoot = dirname(require.resolve('@oma-forge/server/package.json'))
    const candidate = join(serverRoot, '..', '..')
    if (existsSync(join(candidate, 'package.json')) && existsSync(join(candidate, 'apps', 'server'))) {
      return resolve(candidate)
    }
  } catch {
    // not in monorepo layout
  }
  return undefined
}

export function cliDir(): string {
  return dirname(fileURLToPath(import.meta.url))
}
