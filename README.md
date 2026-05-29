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

Set `FORGE_WORKFLOW_PATH` to change the default workflow file.

### Writing a workflow

```ts
// workflows/my-workflow.ts
import { OpenMultiAgent } from '@open-multi-agent/core'
import { bootstrapForgeWorkflow, type ForgeRunContext } from '@oma-forge/reporter'

export default async function run(ctx: ForgeRunContext) {
  const { goal, abortSignal, reporter } = ctx
  const oma = new OpenMultiAgent({
    defaultProvider: 'gemini',
    defaultApiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
    onProgress: reporter.onProgress,
    onTrace: reporter.onTrace,
    onPlanReady: reporter.onPlanReady,
    onAgentStream: reporter.onAgentStream,
  })
  // Wire tools, MCPs, teams here — Forge never sees them.
  const team = oma.createTeam('my-team', { /* ... */ })
  reporter.finish(await oma.runTeam(team, goal, { abortSignal }))
}

void bootstrapForgeWorkflow(run)
```

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
