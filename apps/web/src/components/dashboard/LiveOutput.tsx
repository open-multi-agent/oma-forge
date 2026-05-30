import type { ForgeTraceLine, TaskExecutionRecord, TraceLineLevel } from '@oma-forge/shared'
import { filterTraceLinesForTask } from '@oma-forge/shared'

type LiveOutputProps = {
  readonly tasks: readonly TaskExecutionRecord[]
  readonly traceLines: readonly ForgeTraceLine[]
  /** When set, only trace and status lines for this DAG node are shown. */
  readonly scopeTask?: TaskExecutionRecord | null
  readonly variant?: 'default' | 'coordinator'
  readonly planningDone?: boolean
}

const terminalStatuses = new Set(['completed', 'failed', 'skipped', 'blocked'])

const levelClass: Record<TraceLineLevel, string> = {
  info: 'text-on-surface-variant',
  warn: 'text-secondary',
  error: 'text-error',
  stream: 'text-primary',
}

function formatTracePrefix(line: ForgeTraceLine): string {
  const parts: string[] = []
  if (line.agent) parts.push(line.agent.toUpperCase())
  if (line.taskId) parts.push(line.taskId)
  return parts.length > 0 ? `[${parts.join(':')}] ` : ''
}

function systemMessage(
  variant: 'default' | 'coordinator',
  finished: boolean,
  planningDone?: boolean,
): string {
  if (variant === 'coordinator') {
    if (finished || planningDone) {
      return '[SYSTEM] Coordinator planning finished.'
    }
    return '[SYSTEM] Coordinator planning in progress.'
  }
  return finished
    ? '[SYSTEM] Task graph execution finished.'
    : '[SYSTEM] Task graph execution in progress.'
}

export function LiveOutput({
  tasks,
  traceLines,
  scopeTask,
  variant = 'default',
  planningDone,
}: LiveOutputProps) {
  const scopedTasks = scopeTask ? [scopeTask] : tasks
  const finished =
    variant === 'coordinator'
      ? Boolean(planningDone)
      : scopedTasks.every((task) => terminalStatuses.has(task.status))
  const filteredTrace = scopeTask
    ? filterTraceLinesForTask(traceLines, scopeTask)
    : traceLines
  const visibleTrace = filteredTrace.slice(-80)

  return (
    <div
      className={`bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed space-y-1 overflow-y-auto ${
        variant === 'coordinator' ? 'flex-1 min-h-0 max-h-full' : 'max-h-64'
      }`}
    >
      <p className="text-tertiary">{systemMessage(variant, finished, planningDone)}</p>
      {visibleTrace.map((line, index) => (
        <p
          key={`${line.at}-${index}`}
          className={`whitespace-pre-wrap break-words ${levelClass[line.level]}`}
        >
          {formatTracePrefix(line)}
          {line.message}
        </p>
      ))}
      {visibleTrace.length === 0 && variant === 'coordinator' ? (
        <p className="text-on-surface-variant">Waiting for coordinator output…</p>
      ) : null}
      {visibleTrace.length === 0 && variant !== 'coordinator'
        ? scopedTasks.map((task) => (
            <p
              key={task.id}
              className={
                task.status === 'failed' ? 'text-error' : 'text-on-surface-variant'
              }
            >
              [{task.assignee?.toUpperCase() ?? 'UNASSIGNED'}] {task.title} {'->'}{' '}
              {task.status.toUpperCase()}
            </p>
          ))
        : null}
    </div>
  )
}
