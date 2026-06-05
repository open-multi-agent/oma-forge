# OMA Forge

Early-stage v0.1 scaffold — actively under development.

OMA Forge is a local development environment for building, running, and debugging workflows for [Open Multi Agent (OMA)](https://github.com/open-multi-agent/open-multi-agent). It provides a visual interface to execute and inspect agent workflows in real time.

**OMA Forge is not a new runtime.** It is a debugging and development layer on top of [OMA Core](https://www.npmjs.com/package/@open-multi-agent/core) (`@open-multi-agent/core`).

## v0.1 scope

In v0.1, OMA Forge will focus on:

- Pointing at a user workflow file (TypeScript)
- Running it via a subprocess (`tsx` + `@oma-forge/reporter`)
- Visualizing execution in real time (SSE)
- Inspecting traces and outputs — including tool calls and results

Forge does **not** manage tools or MCPs. Those are wired in your workflow file; edit the file and rerun.

## Project structure

```
oma-forge/
├── apps/
│   ├── server/       # Fastify API + SSE — spawns workflow subprocesses
│   └── web/          # Vite + React + TypeScript UI
├── packages/
│   ├── cli/          # `oma-forge` — npx entry (spawns server + UI)
│   ├── shared/       # Shared Forge API types + event protocol
│   └── reporter/     # Hooks for workflow files to stream events to Forge
├── workflows/        # Example workflow files (e.g. demo.ts)
├── package.json      # npm workspaces root
└── README.md
```

## Tech stack (scaffold)

| Layer | Choice |
| --- | --- |
| Runtime | Node.js ≥ 18 (aligned with OMA) |
| Monorepo | npm workspaces |
| API | Fastify 5 (`/api/health`, `/api/events` SSE, `/api/runs`) |
| Workflow execution | User `.ts` files via `tsx` + `@oma-forge/reporter` |
| OMA runtime | `@open-multi-agent/core` in **your workflow file**, not in Forge |
| Frontend | Vite 6, React 19, TypeScript 5, Tailwind CSS 4 |
| Tests | Vitest (server) |
| Dev | Vite proxies `/api` → local server on port 3001 |

## Getting started

Requires Node.js ≥ 18.

### Run Forge against your workflow (`npx oma-forge`)

From your project (or this repo after `npm install` && `npm run build`):

```bash
npx oma-forge ./path/to/workflow.ts
```

This starts the API and UI, opens [http://localhost:5173](http://localhost:5173), and pre-fills the workflow path. Set a goal and click **Run** to execute via subprocess and watch live progress.

Options: `--no-open`, `--port <n>`, `--web-port <n>`, `--help`.

Forge loads `.env` from the nearest `package.json` directory to your workflow file (API keys, provider settings). Your workflow file must depend on `@oma-forge/reporter` and `@open-multi-agent/core`; install `tsx` to run TypeScript locally.

In this monorepo after building:

```bash
npm run build
npx oma-forge workflows/demo.ts
# or: npm run oma-forge -- workflows/demo.ts
```

### Monorepo development

```bash
git clone https://github.com/open-multi-agent/oma-forge.git
cd oma-forge
npm install
npm run dev
```

This starts both workspaces:

- **Web** — [http://localhost:5173](http://localhost:5173)
- **Server** — [http://localhost:3001](http://localhost:3001)
  - `GET /api/health` — runner status
  - `GET /api/workflow` — default workflow path
  - `GET /api/events` — SSE stream of run progress and trace events
  - `POST /api/runs` — start a workflow (`{ goal?, workflowPath? }`)

Set `FORGE_WORKFLOW_PATH` to change the default workflow file when not using the CLI.

Set `FORGE_RUN_STALL_MS` to control how long a run can go without workflow events before Forge marks it failed (default: 5 minutes). Runs that exit without a `result` event, or report success with no tasks/trace/tokens, are also marked failed with an explicit health reason in the UI.

### Writing a workflow

Use **Open Multi Agent as usual**. Forge only needs:

1. A **default export** (async function) so the runner can invoke your file.
2. **`...forgeHooks()`** spread on your existing `OpenMultiAgent` config (streams progress to the UI; no-op outside Forge).
3. **`process.env.FORGE_GOAL`** for the run goal and **`forgeAbortSignal()`** on `runTeam` so Cancel works (or your own `AbortController` + `SIGTERM` handler).

```ts
// workflows/my-workflow.ts
import { OpenMultiAgent } from '@open-multi-agent/core'
import { forgeAbortSignal, forgeHooks } from '@oma-forge/reporter'

export default async function main() {
  const oma = new OpenMultiAgent({
    defaultProvider: 'gemini',
    defaultApiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
    ...forgeHooks(),
  })
  const team = oma.createTeam('my-team', { /* agents, tools, MCPs */ })
  return oma.runTeam(team, process.env.FORGE_GOAL ?? '', {
    abortSignal: forgeAbortSignal(),
  })
}
```

Return the `runTeam` result and Forge records it automatically. No bootstrap wrapper.

#### Optional: integrate in `@open-multi-agent/core`

To avoid the `forgeHooks()` spread entirely, core could merge a Forge adapter when `FORGE_RUN_ID` is set, e.g. `new OpenMultiAgent(withForge(config))` or built-in env detection. That keeps workflow files identical between CLI and Forge.

For Gemini models, install `@google/genai` and set `GOOGLE_API_KEY` or `GEMINI_API_KEY`.

Other scripts:

```bash
npm run build    # build server + web
npm run preview  # preview production web build
npm run lint     # TypeScript check (server + web)
npm run test     # Vitest (server)
```



## License

Apache License 2.0 — see [LICENSE](LICENSE).
