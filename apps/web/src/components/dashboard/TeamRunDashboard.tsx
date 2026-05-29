import { useCallback, useMemo, useState } from 'react'
import { layoutTasks } from '../../lib/layout-tasks.ts'
import type {
  ForgeDashboardRun,
  ForgeTraceLine,
  RunStatus,
  TaskExecutionRecord,
} from '@oma-forge/shared'
import { DagEdges } from './DagEdges.tsx'
import { DagNode } from './DagNode.tsx'
import { DagViewport } from './DagViewport.tsx'
import { DetailsPanel } from './DetailsPanel.tsx'
import { LiveOutput } from './LiveOutput.tsx'

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
  const isRunning = runStatus === 'running'

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
      if (target.closest('.node') || target.closest('aside')) return
      setPanelOpen(false)
    },
    [],
  )

  return (
    <>
      <main
        className="p-8 h-full min-h-0 grid-pattern relative overflow-hidden flex flex-col lg:flex-row gap-6"
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <DagViewport width={layout.width} height={layout.height}>
            <DagEdges tasks={tasks} layout={layout} />
            <div className="relative w-full h-full">
              {tasks.length === 0 && isRunning ? (
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
          {isRunning ? (
            <section className="shrink-0 border border-outline-variant/20 bg-surface-container-lowest">
              <h2 className="px-3 py-2 text-[10px] font-headline uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                Live output
              </h2>
              <LiveOutput tasks={tasks} traceLines={traceLines} />
            </section>
          ) : null}
        </div>
        <DetailsPanel
          open={panelOpen}
          goal={goal}
          tasks={tasks}
          traceLines={traceLines}
          selected={selected}
          onClose={handleClosePanel}
        />
      </main>
      <div
        className="fixed left-0 top-0 w-1 h-screen bg-gradient-to-b from-primary via-secondary to-tertiary z-[60] opacity-30 pointer-events-none"
        aria-hidden
      />
    </>
  )
}
