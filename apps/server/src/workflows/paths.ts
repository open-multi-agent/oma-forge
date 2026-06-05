import { existsSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { DEFAULT_WORKFLOW_PATH } from '@oma-forge/shared'

function repoRootCandidates(): readonly string[] {
  return [process.cwd(), join(process.cwd(), '..'), join(process.cwd(), '../..')]
}

/** User project root when launched via `oma-forge` CLI (workflow cwd, `.env`, subprocess). */
export function resolveProjectRoot(): string {
  if (process.env.FORGE_PROJECT_ROOT) {
    return resolve(process.env.FORGE_PROJECT_ROOT)
  }
  return resolveRepoRoot()
}

/** Best-effort monorepo root for resolving default workflow paths. */
export function resolveRepoRoot(): string {
  for (const base of repoRootCandidates()) {
    if (existsSync(join(base, 'workflows'))) return base
    if (existsSync(join(base, 'package.json')) && existsSync(join(base, 'apps', 'server'))) {
      return base
    }
  }
  return process.cwd()
}

export function resolveDefaultWorkflowPath(): string {
  if (process.env.FORGE_WORKFLOW_PATH) {
    return resolve(process.env.FORGE_WORKFLOW_PATH)
  }

  for (const base of repoRootCandidates()) {
    const candidate = join(base, DEFAULT_WORKFLOW_PATH)
    if (existsSync(candidate)) return resolve(candidate)
  }

  return resolve(resolveRepoRoot(), DEFAULT_WORKFLOW_PATH)
}

export function resolveWorkflowPath(input?: string): string {
  const trimmed = input?.trim()
  if (!trimmed) return resolveDefaultWorkflowPath()
  if (isAbsolute(trimmed)) return trimmed
  return resolve(resolveProjectRoot(), trimmed)
}

export function workflowPathExists(path: string): boolean {
  return existsSync(path)
}
