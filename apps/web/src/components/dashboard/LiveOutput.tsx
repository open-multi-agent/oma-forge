import type { ForgeTraceLine, TaskExecutionRecord, TraceLineLevel } from '@oma-forge/shared'

type LiveOutputProps = {
  readonly tasks: readonly TaskExecutionRecord[]
  readonly traceLines: readonly ForgeTraceLine[]
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

export function LiveOutput({ tasks, traceLines }: LiveOutputProps) {
  const finished = tasks.every((task) => terminalStatuses.has(task.status))
  const visibleTrace = traceLines.slice(-80)

  return (
    <div className="bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed space-y-1 max-h-64 overflow-y-auto">
      <p className="text-tertiary">
        {finished
          ? '[SYSTEM] Task graph execution finished.'
          : '[SYSTEM] Task graph execution in progress.'}
      </p>
      {visibleTrace.map((line, index) => (
        <p
          key={`${line.at}-${index}`}
          className={`whitespace-pre-wrap break-words ${levelClass[line.level]}`}
        >
          {formatTracePrefix(line)}
          {line.message}
        </p>
      ))}
      {visibleTrace.length === 0
        ? tasks.map((task) => (
            <p
              key={task.id}
              className={
                task.status === 'failed'
                  ? 'text-error'
                  : 'text-on-surface-variant'
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
