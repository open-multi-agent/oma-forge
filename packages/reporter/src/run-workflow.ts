import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runForgeWorkflow } from './run-forge.js'

const workflowPath = process.argv[2]
if (!workflowPath) {
  console.error('oma-forge: missing workflow path')
  process.exit(1)
}

await runForgeWorkflow(async () => {
  const mod = await import(pathToFileURL(resolve(workflowPath)).href)
  const fn = mod.default
  if (typeof fn !== 'function') {
    throw new Error(
      'Workflow must export a default async function — see https://github.com/open-multi-agent/oma-forge',
    )
  }
  return fn()
})
