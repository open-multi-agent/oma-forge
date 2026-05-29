import { TeamRunDashboard } from './components/dashboard/TeamRunDashboard.tsx'
import { DEFAULT_RUN_GOAL } from '@oma-forge/shared'
import { useForgeRun } from './hooks/useForgeRun.ts'

export default function App() {
  const {
    runStatus,
    result,
    traceLines,
    runHistory,
    activeRunId,
    selectedRunId,
    healthOk,
    startError,
    cancelError,
    isStarting,
    isCancelling,
    startRun,
    cancelRun,
    selectRun,
  } = useForgeRun()
  const isRunning = runStatus === 'running'

  return (
    <div className="relative h-screen overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
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
        <span className="text-on-surface-variant">
          run: {runStatus}
          {selectedRunId ? ` · ${selectedRunId.slice(0, 8)}` : ''}
        </span>
        <button
          type="button"
          disabled={isRunning || isStarting || healthOk === false}
          onClick={() => void startRun()}
          className="px-3 py-1 border border-outline-variant/40 text-primary hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running…' : isStarting ? 'Starting…' : 'Run demo'}
        </button>
        <button
          type="button"
          disabled={!isRunning || isCancelling}
          onClick={() => void cancelRun()}
          className="px-3 py-1 border border-outline-variant/40 text-error hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isCancelling ? 'Cancelling…' : 'Cancel'}
        </button>
        {runHistory.length > 0 ? (
          <label className="flex items-center gap-2 ml-auto">
            <span className="text-on-surface-variant">History</span>
            <select
              value={selectedRunId ?? ''}
              onChange={(e) => selectRun(e.target.value)}
              className="bg-surface-container text-on-surface text-[10px] px-2 py-1 border border-outline-variant/40 max-w-[12rem]"
            >
              {runHistory.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.status} · {run.goal?.slice(0, 24) ?? run.id.slice(0, 8)}
                  {run.id === activeRunId ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>
      {startError ? (
        <p className="absolute top-12 right-6 z-50 text-[10px] font-mono text-error">
          start: {startError}
        </p>
      ) : null}
      {cancelError ? (
        <p className="absolute top-16 right-6 z-50 text-[10px] font-mono text-error">
          cancel: {cancelError}
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
