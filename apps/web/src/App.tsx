import { TeamRunDashboard } from './components/dashboard/TeamRunDashboard.tsx'
import {
  DEFAULT_WORKFLOW_PATH,
  formatRunStatusLabel,
  healthBanner,
  runStatusTone,
} from '@oma-forge/shared'
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
    workflowPath,
    setWorkflowPath,
    goal,
    setGoal,
    startRun,
    cancelRun,
    selectRun,
    runHealth,
  } = useForgeRun()
  const isRunning = runStatus === 'running'
  const runLabel = formatRunStatusLabel(runStatus, runHealth)
  const runTone = runStatusTone(runStatus, runHealth)
  const runHealthMessage = healthBanner({ status: runStatus, health: runHealth })
  const showDashboard =
    runStatus === 'running' ||
    runStatus === 'completed' ||
    runStatus === 'failed' ||
    runStatus === 'cancelled' ||
    (result.tasks?.length ?? 0) > 0
  const canRun =
    healthOk === true &&
    !isRunning &&
    !isStarting &&
    workflowPath.trim().length > 0 &&
    goal.trim().length > 0

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 z-50 border-b border-outline-variant/10 bg-surface px-6 py-3 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-3">
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
          <span
            className={
              runTone === 'success'
                ? 'text-tertiary'
                : runTone === 'error'
                  ? 'text-error'
                  : runTone === 'warn'
                    ? 'text-secondary'
                    : 'text-on-surface-variant'
            }
          >
            run: {runLabel}
            {selectedRunId ? ` · ${selectedRunId.slice(0, 8)}` : ''}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={!canRun}
              onClick={() => void startRun()}
              className="px-3 py-1 border border-outline-variant/40 text-primary hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running…' : isStarting ? 'Starting…' : 'Run'}
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
              <label className="flex items-center gap-2">
                <span className="text-on-surface-variant">History</span>
                <select
                  value={selectedRunId ?? ''}
                  onChange={(e) => selectRun(e.target.value)}
                  className="bg-surface-container text-on-surface text-[10px] px-2 py-1 border border-outline-variant/40 max-w-[12rem]"
                >
                  {runHistory.map((run) => (
                    <option key={run.id} value={run.id}>
                      {formatRunStatusLabel(run.status, run.health)} ·{' '}
                      {run.goal?.slice(0, 24) ?? run.id.slice(0, 8)}
                      {run.id === activeRunId ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <label className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
            <span className="text-on-surface-variant">Workflow</span>
            <input
              type="text"
              value={workflowPath}
              onChange={(e) => setWorkflowPath(e.target.value)}
              disabled={isRunning || isStarting}
              placeholder={DEFAULT_WORKFLOW_PATH}
              className="min-w-0 w-full bg-surface-container text-on-surface text-[10px] px-2 py-1 border border-outline-variant/40 font-mono normal-case tracking-normal disabled:opacity-40"
            />
          </label>
          <label className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
            <span className="text-on-surface-variant">Goal</span>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isRunning || isStarting}
              placeholder="What should the team work on?"
              className="min-w-0 w-full bg-surface-container text-on-surface text-[10px] px-2 py-1 border border-outline-variant/40 font-mono normal-case tracking-normal disabled:opacity-40"
            />
          </label>
        </div>

        {startError ? (
          <p className="mt-2 text-[10px] font-mono text-error normal-case tracking-normal">
            start: {startError}
          </p>
        ) : null}
        {cancelError ? (
          <p className="mt-1 text-[10px] font-mono text-error normal-case tracking-normal">
            cancel: {cancelError}
          </p>
        ) : null}
        {runHealthMessage ? (
          <p className="mt-2 text-[10px] font-mono text-error normal-case tracking-normal">
            {runHealthMessage}
          </p>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {showDashboard ? (
          <TeamRunDashboard result={result} traceLines={traceLines} runStatus={runStatus} />
        ) : (
          <main className="flex h-full items-center justify-center p-8 text-on-surface-variant text-sm">
            <div className="max-w-md text-center space-y-4 normal-case tracking-normal">
              <p>
                Point Forge at your workflow file, set a goal, and run. Tools and MCPs live in the
                workflow file.
              </p>
              <p className="text-[10px] font-mono text-outline break-all">
                {workflowPath || DEFAULT_WORKFLOW_PATH}
              </p>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
