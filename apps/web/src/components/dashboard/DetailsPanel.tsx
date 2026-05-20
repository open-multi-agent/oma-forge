import type { TaskExecutionRecord } from '../../types/team-run.ts'
import { statusStyles } from './status-styles.ts'
import { LiveOutput } from './LiveOutput.tsx'

type DetailsPanelProps = {
  readonly open: boolean
  readonly goal: string
  readonly tasks: readonly TaskExecutionRecord[]
  readonly selected: TaskExecutionRecord | null
  readonly onClose: () => void
}

export function DetailsPanel({ open, goal, tasks, selected, onClose }: DetailsPanelProps) {
  const metrics = selected?.metrics
  const statusLabel = selected
    ? (statusStyles[selected.status] ?? statusStyles.pending).chip
    : '-'
  const usage = metrics?.tokenUsage ?? { input_tokens: 0, output_tokens: 0 }
  const inTokens = usage.input_tokens
  const outTokens = usage.output_tokens
  const total = inTokens + outTokens
  const ratio = total > 0 ? Math.round((inTokens / total) * 100) : 0

  return (
    <aside
      className={`${open ? 'flex flex-1' : 'hidden'} w-full lg:w-[400px] lg:flex-none shrink-0 min-h-0 max-h-full overflow-y-auto overscroll-contain bg-surface-container-high p-6 flex-col gap-8 border-l border-outline-variant/10 relative`}
    >
      <div>
        <h2 className="font-headline font-black text-lg tracking-widest mb-6 text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          NODE_DETAILS
        </h2>
        <button
          type="button"
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
          onClick={onClose}
          aria-label="Close panel"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
              Goal
            </label>
            <p className="text-xs bg-surface-container p-3 border-b border-outline-variant/20">
              {goal}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
              Assigned Agent
            </label>
            <div className="flex items-center gap-4 bg-surface-container p-3">
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {selected?.assignee ?? 'UNASSIGNED'}
                </p>
                <p className="text-[10px] font-mono text-secondary">
                  ACTIVE STATE: {statusLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                Execution Start
              </label>
              <p className="text-xs font-mono bg-surface-container p-2 border-b border-outline-variant/20">
                {metrics?.startMs ? new Date(metrics.startMs).toISOString() : '-'}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                Execution End
              </label>
              <p className="text-xs font-mono bg-surface-container p-2 border-b border-outline-variant/20 text-on-surface-variant">
                {metrics?.endMs ? new Date(metrics.endMs).toISOString() : '-'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
              Token Breakdown
            </label>
            <div className="space-y-2 bg-surface-container p-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-on-surface-variant">PROMPT:</span>
                <span className="text-on-surface">{inTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-on-surface-variant">COMPLETION:</span>
                <span className="text-on-surface text-secondary">
                  {outTokens.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1 bg-surface-variant mt-2">
                <div className="bg-primary h-full" style={{ width: `${ratio}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
              Tool Calls
            </label>
            <p className="text-xs font-mono bg-surface-container p-2 border-b border-outline-variant/20">
              {(metrics?.toolCalls ?? []).length}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="font-headline font-black text-[10px] tracking-widest mb-4 text-on-surface-variant">
          LIVE_AGENT_OUTPUT
        </h2>
        <LiveOutput tasks={tasks} />
      </div>
    </aside>
  )
}
