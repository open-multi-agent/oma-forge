import { useCallback, useMemo, useState } from 'react'
import { layoutTasks } from '../../lib/layout-tasks.ts'
import type { TaskExecutionRecord, TeamRunResult } from '../../types/team-run.ts'
import type { ForgeTraceLine } from '../../types/trace.ts'
import { DagEdges } from './DagEdges.tsx'
import { DagNode } from './DagNode.tsx'
import { DagViewport } from './DagViewport.tsx'
import { DetailsPanel } from './DetailsPanel.tsx'

type TeamRunDashboardProps = {
  readonly result: TeamRunResult
  readonly traceLines: readonly ForgeTraceLine[]
}

export function TeamRunDashboard({ result, traceLines }: TeamRunDashboardProps) {
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
        <DagViewport width={layout.width} height={layout.height}>
          <DagEdges tasks={tasks} layout={layout} />
          <div className="relative w-full h-full">
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
