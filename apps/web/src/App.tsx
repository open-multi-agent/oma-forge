import { useEffect, useState } from 'react'

type HealthResponse = {
  ok: boolean
  runtime: string
  orchestrator: unknown
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<HealthResponse>
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setHealthError(err instanceof Error ? err.message : 'Failed to reach OMA Core')
      })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Open Multi Agent
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">OMA Forge</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Local development environment for building, running, and debugging OMA workflows.
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-medium text-zinc-300">Scaffold</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            This repo is an early v0.1 scaffold. Workflow loading, live DAG visualization, and
            trace inspection will land in follow-up changes.
          </p>

          <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm">
            <span className="text-zinc-500">OMA Core: </span>
            {health ? (
              <span className="text-emerald-400">connected ({health.runtime})</span>
            ) : healthError ? (
              <span className="text-amber-400">{healthError}</span>
            ) : (
              <span className="text-zinc-500">checking…</span>
            )}
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Runtime:{' '}
            <a
              className="text-sky-400 underline-offset-2 hover:underline"
              href="https://github.com/open-multi-agent/open-multi-agent"
              rel="noreferrer"
              target="_blank"
            >
              open-multi-agent
            </a>{' '}
            (<code className="text-zinc-400">@open-multi-agent/core</code>)
          </p>
        </section>
      </main>
    </div>
  )
}
