import { TeamRunDashboard } from './components/dashboard/TeamRunDashboard.tsx'
import { DEFAULT_RUN_GOAL } from './lib/constants.ts'
import { useForgeRun } from './hooks/useForgeRun.ts'

export default function App() {
  const { runStatus, result, traceLines, healthOk, startError, isStarting, startRun } =
    useForgeRun()
  const isRunning = runStatus === 'running'

  return (
    <div className="relative h-screen overflow-hidden">
      <header className="absolute top-0 right-0 z-50 flex items-center gap-4 px-6 py-3 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
        <span className="text-primary font-black">OMA Forge</span>
        <span
          className={
            healthOk === true
              ? 'text-tertiary'
              : healthOk === false
                ? 'text-error'
                : 'text-on-surface-variant'
          }
        >
          {healthOk === true ? 'API online' : healthOk === false ? 'API offline' : 'API …'}
        </span>
        <span className="text-on-surface-variant">run: {runStatus}</span>
        <button
          type="button"
          disabled={isRunning || isStarting || healthOk === false}
          onClick={() => void startRun()}
          className="px-3 py-1 border border-outline-variant/40 text-primary hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running…' : isStarting ? 'Starting…' : 'Run demo'}
        </button>
      </header>
      {startError ? (
        <p className="absolute top-12 right-6 z-50 text-[10px] font-mono text-error">
          {startError}
        </p>
      ) : null}
      {result.tasks && result.tasks.length > 0 ? (
        <TeamRunDashboard result={result} traceLines={traceLines} />
      ) : (
        <main className="flex h-full items-center justify-center p-8 text-on-surface-variant text-sm">
          <div className="max-w-md text-center space-y-4">
            <p>Start a demo team run to populate the live DAG.</p>
            <p className="text-[10px] font-mono text-outline">{DEFAULT_RUN_GOAL}</p>
          </div>
        </main>
      )}
    </div>
  )
}
