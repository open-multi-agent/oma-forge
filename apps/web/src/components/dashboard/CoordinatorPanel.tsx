import { useEffect, useMemo, useRef, useState } from 'react'
import {
  filterTraceLinesForCoordinator,
  type ForgeTraceLine,
  type RunStatus,
} from '@oma-forge/shared'
import { LiveOutput } from './LiveOutput.tsx'

type CoordinatorPanelProps = {
  readonly traceLines: readonly ForgeTraceLine[]
  readonly runStatus?: RunStatus
  readonly hasPlanTasks: boolean
}

export function CoordinatorPanel({
  traceLines,
  runStatus,
  hasPlanTasks,
}: CoordinatorPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const autoExpanded = useRef(false)
  const coordinatorLines = useMemo(
    () => filterTraceLinesForCoordinator(traceLines),
    [traceLines],
  )
  const hasActivity = coordinatorLines.length > 0
  const isRunning = runStatus === 'running'
  const planningDone = hasPlanTasks || !isRunning

  useEffect(() => {
    if (!hasActivity || autoExpanded.current) return
    autoExpanded.current = true
    setExpanded(true)
  }, [hasActivity])

  if (!isRunning && !hasActivity) {
    return null
  }

  return (
    <section
      data-collateral
      className={`flex flex-col shrink-0 border-b border-outline-variant/10 ${expanded ? 'min-h-0 max-h-[min(42vh,360px)]' : ''}`}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-surface-container transition-colors"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span className="material-symbols-outlined text-primary text-lg">hub</span>
        <span className="font-headline font-black text-[10px] tracking-widest text-on-surface-variant flex-1">
          COORDINATOR
        </span>
        {hasActivity ? (
          <span className="text-[9px] font-mono text-secondary tabular-nums">
            {coordinatorLines.length}
          </span>
        ) : null}
        {isRunning && !planningDone ? (
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
        ) : null}
        <span className="material-symbols-outlined text-on-surface-variant">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {expanded ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
          <LiveOutput
            traceLines={coordinatorLines}
            tasks={[]}
            variant="coordinator"
            planningDone={planningDone}
          />
        </div>
      ) : null}
    </section>
  )
}
