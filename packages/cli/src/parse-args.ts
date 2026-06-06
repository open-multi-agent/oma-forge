export type CliOptions = {
  readonly workflowPath: string | undefined
  readonly openBrowser: boolean
  readonly apiPort: number
  readonly webPort: number
  readonly help: boolean
}

export function parseArgs(argv: readonly string[]): CliOptions {
  let workflowPath: string | undefined
  let openBrowser = true
  let apiPort = 3001
  let webPort = 5173
  let help = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      help = true
      continue
    }
    if (arg === '--no-open') {
      openBrowser = false
      continue
    }
    if (arg === '--port') {
      apiPort = parsePort(argv[++i], 'port')
      continue
    }
    if (arg === '--web-port') {
      webPort = parsePort(argv[++i], 'web-port')
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    if (workflowPath) {
      throw new Error(`Unexpected argument: ${arg}`)
    }
    workflowPath = arg
  }

  return { workflowPath, openBrowser, apiPort, webPort, help }
}

function parsePort(value: string | undefined, name: string): number {
  if (!value) throw new Error(`Missing value for --${name}`)
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid --${name}: ${value}`)
  }
  return port
}

export const HELP_TEXT = `Usage: oma-forge <workflow.ts> [options]

  Start the Forge API and UI pointed at your workflow file.

Options:
  --port <n>       API port (default: 3001)
  --web-port <n>   UI port (default: 5173)
  --no-open        Do not open a browser tab
  -h, --help       Show this help

Environment:
  Loads .env from your project root (nearest package.json to the workflow).
  API keys and provider settings belong in that file or the shell environment.

Example:
  npx oma-forge ./workflows/my-workflow.ts
`
