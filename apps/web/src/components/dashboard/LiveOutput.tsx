import type { TaskExecutionRecord } from '../../types/team-run.ts'

type LiveOutputProps = {
  readonly tasks: readonly TaskExecutionRecord[]
}

const terminalStatuses = new Set(['completed', 'failed', 'skipped', 'blocked'])

export function LiveOutput({ tasks }: LiveOutputProps) {
  const finished = tasks.every((task) => terminalStatuses.has(task.status))

  return (
    <div className="bg-surface-container-lowest p-3 font-mono text-[10px] leading-relaxed space-y-1">
      <p className="text-tertiary">
        {finished
          ? '[SYSTEM] Task graph execution finished.'
          : '[SYSTEM] Task graph execution in progress.'}
      </p>
      {tasks.map((task) => (
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
      ))}
    </div>
  )
}
