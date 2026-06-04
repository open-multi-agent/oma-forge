import type { LayoutTasksResult } from '../../lib/layout-tasks.ts'

function makeEdgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1)
  const bend = Math.max(42, dx * 0.35)
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
}

type DagEdgesProps = {
  readonly layout: LayoutTasksResult
}

export function DagEdges({ layout }: DagEdgesProps) {
  const { positions, edges, width, height, nodeW, nodeH } = layout

  return (
    <svg
      className="absolute inset-0 z-[1] w-full h-full pointer-events-none text-outline"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <marker
          id="forge-dag-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" className="fill-current" />
        </marker>
      </defs>
      {edges.map(({ fromId, toId }) => {
        const from = positions.get(fromId)
        const to = positions.get(toId)
        if (!from || !to) return null

        const sameColumn = from.x === to.x
        const x1 = sameColumn ? from.x + nodeW / 2 : from.x + nodeW
        const y1 = sameColumn ? from.y + nodeH : from.y + nodeH / 2
        const x2 = sameColumn ? to.x + nodeW / 2 : to.x
        const y2 = sameColumn ? to.y : to.y + nodeH / 2

        return (
          <path
            key={`${fromId}-${toId}`}
            d={makeEdgePath(x1, y1, x2, y2)}
            fill="none"
            className="stroke-current"
            strokeWidth={2}
            strokeOpacity={0.85}
            markerEnd="url(#forge-dag-arrow)"
          />
        )
      })}
    </svg>
  )
}
