#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { spawn, type ChildProcess } from 'node:child_process'
import { cwd } from 'node:process'
import { resolveProjectRoot } from './resolve-project-root.js'
import { HELP_TEXT, parseArgs } from './parse-args.js'
import { openBrowser } from './open-browser.js'
import {
  resolveForgeMonorepoRoot,
  resolveReporterDist,
  resolveServerEntry,
  resolveSharedDist,
  resolveViteCli,
  resolveWebRoot,
  resolveWorkflowArg,
} from './paths.js'

function die(message: string): never {
  console.error(`oma-forge: ${message}`)
  process.exit(1)
}

function missingBuildHint(): string {
  const root = resolveForgeMonorepoRoot()
  if (root) {
    return `Run "npm run build" from ${root} (or clone oma-forge and build once).`
  }
  return 'Reinstall oma-forge or run from a built oma-forge checkout.'
}

function ensureBuiltArtifacts(): void {
  const missing: string[] = []
  if (!existsSync(resolveServerEntry())) missing.push('@oma-forge/server')
  if (!existsSync(resolveSharedDist())) missing.push('@oma-forge/shared')
  if (!existsSync(resolveReporterDist())) missing.push('@oma-forge/reporter')
  if (missing.length > 0) {
    die(`Missing build output for ${missing.join(', ')}. ${missingBuildHint()}`)
  }
}

function spawnChild(
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv,
  options: { readonly cwd?: string },
): ChildProcess {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env,
    stdio: 'inherit',
    shell: false,
  })
  child.on('error', (err) => {
    console.error(`oma-forge: failed to start ${command}: ${err.message}`)
    process.exit(1)
  })
  return child
}

async function main(): Promise<void> {
  let options: ReturnType<typeof parseArgs>
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (err) {
    die(err instanceof Error ? err.message : String(err))
  }

  if (options.help) {
    console.log(HELP_TEXT)
    return
  }

  if (!options.workflowPath) {
    console.error(HELP_TEXT)
    die('Workflow path is required.')
  }

  const workflowPath = resolveWorkflowArg(options.workflowPath, cwd())
  if (!existsSync(workflowPath)) {
    die(`Workflow file not found: ${workflowPath}`)
  }

  ensureBuiltArtifacts()

  const projectRoot = resolveProjectRoot(workflowPath)
  const serverEntry = resolveServerEntry()
  const webRoot = resolveWebRoot()
  const viteCli = resolveViteCli(webRoot)
  const webUrl = `http://localhost:${options.webPort}`

  const baseEnv: NodeJS.ProcessEnv = {
    ...process.env,
    FORGE_WORKFLOW_PATH: workflowPath,
    FORGE_PROJECT_ROOT: projectRoot,
    PORT: String(options.apiPort),
    FORGE_API_PORT: String(options.apiPort),
  }

  console.log(`oma-forge: workflow ${workflowPath}`)
  console.log(`oma-forge: project root ${projectRoot}`)
  console.log(`oma-forge: API http://localhost:${options.apiPort}`)
  console.log(`oma-forge: UI  ${webUrl}`)

  const children: ChildProcess[] = []
  let shuttingDown = false

  const shutdown = (code = 0) => {
    if (shuttingDown) return
    shuttingDown = true
    for (const child of children) {
      if (!child.killed) child.kill('SIGTERM')
    }
    process.exit(code)
  }

  process.on('SIGINT', () => shutdown(130))
  process.on('SIGTERM', () => shutdown(143))

  children.push(
    spawnChild(process.execPath, [serverEntry], baseEnv, {}),
    spawnChild(
      process.execPath,
      [viteCli, '--config', 'vite.config.ts', '--port', String(options.webPort), '--strictPort'],
      baseEnv,
      { cwd: webRoot },
    ),
  )

  if (options.openBrowser) {
    setTimeout(() => openBrowser(webUrl), 1200)
  }

  await Promise.race(
    children.map(
      (child) =>
        new Promise<number | null>((resolve) => {
          child.on('close', (code) => resolve(code))
        }),
    ),
  ).then((code) => {
    if (code !== 0 && code !== null) {
      console.error(`oma-forge: process exited with code ${code}`)
    }
    shutdown(code ?? 1)
  })
}

void main()
