import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  resolveProjectRoot,
  resolveRepoRoot,
  resolveWorkflowPath,
} from '../src/workflows/paths.js'

describe('workflow paths', () => {
  const previousProjectRoot = process.env.FORGE_PROJECT_ROOT
  const previousWorkflowPath = process.env.FORGE_WORKFLOW_PATH

  beforeEach(() => {
    delete process.env.FORGE_PROJECT_ROOT
    delete process.env.FORGE_WORKFLOW_PATH
  })

  afterEach(() => {
    if (previousProjectRoot === undefined) delete process.env.FORGE_PROJECT_ROOT
    else process.env.FORGE_PROJECT_ROOT = previousProjectRoot
    if (previousWorkflowPath === undefined) delete process.env.FORGE_WORKFLOW_PATH
    else process.env.FORGE_WORKFLOW_PATH = previousWorkflowPath
  })

  it('resolveProjectRoot uses FORGE_PROJECT_ROOT when set', () => {
    const dir = mkdtempSync(join(tmpdir(), 'oma-forge-root-'))
    process.env.FORGE_PROJECT_ROOT = dir
    expect(resolveProjectRoot()).toBe(dir)
  })

  it('resolveWorkflowPath resolves relative paths against FORGE_PROJECT_ROOT', () => {
    const dir = mkdtempSync(join(tmpdir(), 'oma-forge-proj-'))
    const workflows = join(dir, 'workflows')
    mkdirSync(workflows, { recursive: true })
    const file = join(workflows, 'custom.ts')
    writeFileSync(file, 'export default async function run() {}')

    process.env.FORGE_PROJECT_ROOT = dir
    expect(resolveWorkflowPath('workflows/custom.ts')).toBe(file)
  })

  it('resolveWorkflowPath keeps absolute paths unchanged', () => {
    const file = join(tmpdir(), 'abs-workflow.ts')
    expect(resolveWorkflowPath(file)).toBe(file)
  })

  it('resolveDefaultWorkflowPath uses FORGE_WORKFLOW_PATH when set', () => {
    const file = join(tmpdir(), 'env-workflow.ts')
    process.env.FORGE_WORKFLOW_PATH = file
    expect(resolveWorkflowPath()).toBe(file)
  })

  it('resolveRepoRoot still finds oma-forge monorepo layout', () => {
    expect(existsSync(join(resolveRepoRoot(), 'apps', 'server'))).toBe(true)
  })
})
