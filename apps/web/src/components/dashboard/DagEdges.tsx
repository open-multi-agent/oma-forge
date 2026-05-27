import type { LayoutTasksResult } from '../../lib/layout-tasks.ts'
import type { TaskExecutionRecord } from '@oma-forge/shared'

function makeEdgePath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} C ${x1 + 42} ${y1}, ${x2 - 42} ${y2}, ${x2} ${y2}`
}

type DagEdgesProps = {
  readonly tasks: readonly TaskExecutionRecord[]
  readonly layout: LayoutTasksResult
}

export function DagEdges({ tasks, layout }: DagEdgesProps) {
  const { positions, width, height, nodeW, nodeH } = layout

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="#40485d" />
        </marker>
      </defs>
      {tasks.flatMap((task) => {
        const to = positions.get(task.id)
        if (!to) return []

        return (task.dependsOn ?? []).flatMap((depId) => {
          const from = positions.get(depId)
          if (!from) return []

          return (
            <path
              key={`${depId}-${task.id}`}
              d={makeEdgePath(from.x + nodeW, from.y + nodeH / 2, to.x, to.y + nodeH / 2)}
              fill="none"
              stroke="#40485d"
              strokeWidth={2}
              markerEnd="url(#arrow)"
            />
          )
        })
      })}
    </svg>
  )
}
