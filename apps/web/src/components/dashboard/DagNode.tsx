import type { TaskExecutionRecord } from '../../types/team-run.ts'
import { durationText, statusStyles } from './status-styles.ts'

type DagNodeProps = {
  readonly task: TaskExecutionRecord
  readonly index: number
  readonly x: number
  readonly y: number
  readonly onSelect: (task: TaskExecutionRecord) => void
}

export function DagNode({ task, index, x, y, onSelect }: DagNodeProps) {
  const status = statusStyles[task.status] ?? statusStyles.pending
  const nodeId = `#NODE_${String(index + 1).padStart(3, '0')}`
  const chips = [task.assignee ? task.assignee.toUpperCase() : 'UNASSIGNED', status.chip]

  return (
    <button
      type="button"
      className={`node absolute w-64 border-l-2 p-4 cursor-pointer text-left ${status.border} ${status.container}`}
      style={{ left: x, top: y }}
      onClick={() => onSelect(task)}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] font-mono ${status.iconColor}`}>{nodeId}</span>
        <span
          className={`material-symbols-outlined ${status.iconColor} text-lg ${status.spin ? 'animate-spin' : ''}`}
        >
          {status.icon}
        </span>
      </div>
      <h3 className="font-headline font-bold text-sm tracking-tight mb-1">{task.title}</h3>
      <p className={`text-xs ${status.statusColor} mb-4`}>STATUS: {durationText(task)}</p>
      <div className="flex gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="px-2 py-0.5 bg-surface-variant text-[9px] font-mono text-on-surface-variant"
          >
            {chip}
          </span>
        ))}
      </div>
    </button>
  )
}
