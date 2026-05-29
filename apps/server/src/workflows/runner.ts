import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'
import { createInterface, type Interface } from 'node:readline'
import {
  FORGE_PROTOCOL_PREFIX,
  parseForgeWorkflowLine,
  type ForgeWorkflowEvent,
} from '@oma-forge/shared'
import { resolveRepoRoot } from './paths.js'

const require = createRequire(import.meta.url)

function resolveTsxCli(): string {
  const tsxRoot = dirname(require.resolve('tsx/package.json'))
  return join(tsxRoot, 'dist/cli.mjs')
}

export type RunWorkflowSubprocessOptions = {
  readonly runId: string
  readonly goal: string
  readonly workflowPath: string
  readonly abortSignal: AbortSignal
  readonly onEvent: (event: ForgeWorkflowEvent) => void
  readonly onStderrLine?: (line: string) => void
}

export type RunWorkflowSubprocessResult = {
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
}

export async function runWorkflowSubprocess(
  options: RunWorkflowSubprocessOptions,
): Promise<RunWorkflowSubprocessResult> {
  const tsxCli = resolveTsxCli()
  const cwd = resolveRepoRoot()

  const child: ChildProcess = spawn(
    process.execPath,
    [tsxCli, options.workflowPath],
    {
      cwd,
      env: {
        ...process.env,
        FORGE_RUN_ID: options.runId,
        FORGE_GOAL: options.goal,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  const stdout = child.stdout
  if (!stdout) throw new Error('Workflow subprocess stdout is unavailable')

  const stdoutReader = createInterface({ input: stdout })
  let stderrReader: Interface | undefined

  stdoutReader.on('line', (line) => {
    const event = parseForgeWorkflowLine(line)
    if (event) {
      options.onEvent(event)
      return
    }
    if (line.trim().length > 0 && !line.startsWith(FORGE_PROTOCOL_PREFIX)) {
      options.onStderrLine?.(line)
    }
  })

  const stderrStream = child.stderr
  if (stderrStream) {
    stderrReader = createInterface({ input: stderrStream })
    stderrReader.on('line', (line) => {
      options.onStderrLine?.(line)
    })
  }

  const onAbort = () => {
    if (!child.killed) child.kill('SIGTERM')
  }
  options.abortSignal.addEventListener('abort', onAbort)

  try {
    return await new Promise((resolve, reject) => {
      let exitCode: number | null = null
      let signal: NodeJS.Signals | null = null
      let processClosed = false
      let stdoutClosed = false

      const maybeResolve = () => {
        if (!processClosed || !stdoutClosed) return
        resolve({ exitCode, signal })
      }

      child.on('error', reject)
      child.on('close', (code, sig) => {
        exitCode = code
        signal = sig
        processClosed = true
        maybeResolve()
      })

      stdoutReader.on('close', () => {
        stdoutClosed = true
        maybeResolve()
      })
    })
  } finally {
    options.abortSignal.removeEventListener('abort', onAbort)
    stdoutReader.close()
    stderrReader?.close()
    child.stdout?.destroy()
    child.stderr?.destroy()
  }
}
