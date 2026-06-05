import { useCallback, useMemo, useState } from 'react'
import { layoutTasks } from '../../lib/layout-tasks.ts'
import type {
  ForgeDashboardRun,
  ForgeTraceLine,
  RunStatus,
  TaskExecutionRecord,
} from '@oma-forge/shared'
import { CoordinatorPanel } from './CoordinatorPanel.tsx'
import { DagEdges } from './DagEdges.tsx'
import { DagNode } from './DagNode.tsx'
import { DagViewport } from './DagViewport.tsx'
import { DetailsPanel } from './DetailsPanel.tsx'

type TeamRunDashboardProps = {
  readonly result: ForgeDashboardRun
  readonly traceLines: readonly ForgeTraceLine[]
  readonly runStatus?: RunStatus
}

export function TeamRunDashboard({ result, traceLines, runStatus }: TeamRunDashboardProps) {
  const tasks = result.tasks ?? []
  const goal = result.goal ?? ''
  const layout = useMemo(() => layoutTasks(tasks), [tasks])
  const [panelOpen, setPanelOpen] = useState(false)
  const [selected, setSelected] = useState<TaskExecutionRecord | null>(null)

  const handleSelect = useCallback((task: TaskExecutionRecord) => {
    setSelected(task)
    setPanelOpen(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('.node') ||
        target.closest('[data-collateral]') ||
        target.closest('[data-node-details]')
      ) {
        return
      }
      setPanelOpen(false)
    },
    [],
  )

  return (
    <>
      <main
        className="p-8 h-full min-h-0 grid-pattern relative overflow-hidden flex flex-col lg:flex-row gap-0"
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DagViewport width={layout.width} height={layout.height}>
            <DagEdges layout={layout} />
            <div className="relative z-[2] w-full h-full">
              {tasks.length === 0 && runStatus === 'running' ? (
                <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm normal-case tracking-normal">
                  Waiting for task plan…
                </div>
              ) : null}
              {tasks.map((task, idx) => {
                const pos = layout.positions.get(task.id)
                if (!pos) return null
                return (
                  <DagNode
                    key={task.id}
                    task={task}
                    index={idx}
                    x={pos.x}
                    y={pos.y}
                    onSelect={handleSelect}
                  />
                )
              })}
            </div>
          </DagViewport>
        </div>

        <div className="flex w-full lg:w-[min(420px,38vw)] shrink-0 min-h-0 max-h-full flex-col border-l border-outline-variant/10 bg-surface-container-high">
          <CoordinatorPanel
            traceLines={traceLines}
            runStatus={runStatus}
            hasPlanTasks={tasks.length > 0}
          />
          <DetailsPanel
            open={panelOpen}
            goal={goal}
            tasks={tasks}
            traceLines={traceLines}
            selected={selected}
            onClose={handleClosePanel}
          />
        </div>
      </main>
      <div
        className="fixed left-0 top-0 w-1 h-screen bg-gradient-to-b from-primary via-secondary to-tertiary z-[60] opacity-30 pointer-events-none"
        aria-hidden
      />
    </>
  )
}
