# OMA Forge

Early-stage v0.1 scaffold — actively under development.

OMA Forge is a local development environment for building, running, and debugging workflows for [Open Multi Agent (OMA)](https://github.com/open-multi-agent/open-multi-agent). It provides a visual interface to execute and inspect agent workflows in real time.

**OMA Forge is not a new runtime.** It is a debugging and development layer on top of [OMA Core](https://www.npmjs.com/package/@open-multi-agent/core) (`@open-multi-agent/core`).

## v0.1 scope

In v0.1, OMA Forge will focus on:

- Loading OMA workflows
- Running workflows via OMA Core
- Visualizing execution in real time
- Inspecting traces and outputs

Feature work beyond the scaffold is still in progress.

## Project structure

```
oma-forge/
├── apps/
│   ├── server/       # Fastify API + SSE — hosts @open-multi-agent/core
│   └── web/          # Vite + React + TypeScript UI
├── package.json      # npm workspaces root
└── README.md
```

## Tech stack (scaffold)

| Layer | Choice |
| --- | --- |
| Runtime | Node.js ≥ 18 (aligned with OMA) |
| Monorepo | npm workspaces |
| API | Fastify 5 (`/api/health`, `/api/events` SSE) |
| OMA runtime | `@open-multi-agent/core` in `apps/server` |
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
  - `GET /api/health` — OMA Core status
  - `GET /api/events` — SSE stream of orchestrator progress events

Other scripts:

```bash
npm run build    # build server + web
npm run preview  # preview production web build
npm run lint     # TypeScript check (server + web)
npm run test     # Vitest (server)
```



## License

Apache License 2.0 — see [LICENSE](LICENSE).
