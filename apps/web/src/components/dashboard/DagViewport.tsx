import { useEffect, useRef, useState, type ReactNode } from 'react'

type ViewTransform = {
  readonly scale: number
  readonly x: number
  readonly y: number
}

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5
/** Higher = faster zoom per scroll tick. */
const ZOOM_INTENSITY = 0.0035

type DagViewportProps = {
  readonly width: number
  readonly height: number
  readonly children: ReactNode
}

function clampScale(scale: number): number {
  return Math.min(Math.max(MIN_SCALE, scale), MAX_SCALE)
}

/** Zoom toward cursor for `translate(tx, ty) scale(s)` with origin top-left. */
function zoomTowardPoint(
  prev: ViewTransform,
  pointerX: number,
  pointerY: number,
  nextScale: number,
): ViewTransform {
  const ratio = nextScale / prev.scale
  return {
    scale: nextScale,
    x: pointerX - (pointerX - prev.x) * ratio,
    y: pointerY - (pointerY - prev.y) * ratio,
  }
}

function wheelDeltaPixels(event: WheelEvent): number {
  let delta = event.deltaY
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 16
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= event.currentTarget instanceof Element
      ? (event.currentTarget as Element).clientHeight
      : 800
  }
  return delta
}

export function DagViewport({ width, height, children }: DagViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<ViewTransform>({ scale: 1, x: 0, y: 0 })
  const [transform, setTransform] = useState<ViewTransform>(transformRef.current)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const applyTransform = (next: ViewTransform) => {
    transformRef.current = next
    setTransform(next)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()

      const rect = viewport.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top
      const delta = wheelDeltaPixels(event)
      const prev = transformRef.current
      const factor = Math.exp(-delta * ZOOM_INTENSITY)
      const nextScale = clampScale(prev.scale * factor)

      if (nextScale === prev.scale) return

      applyTransform(zoomTowardPoint(prev, pointerX, pointerY, nextScale))
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
    viewportRef.current?.classList.add('cursor-grabbing')
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    applyTransform({
      ...transformRef.current,
      x: transformRef.current.x + dx,
      y: transformRef.current.y + dy,
    })
  }

  const onMouseUp = () => {
    dragging.current = false
    viewportRef.current?.classList.remove('cursor-grabbing')
  }

  return (
    <div
      ref={viewportRef}
      className="flex-1 relative min-h-[600px] overflow-hidden cursor-grab touch-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{
          width,
          height,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
