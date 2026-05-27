import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_RUN_GOAL,
  emptyDashboardRun,
  parseForgeEvent,
  runSnapshotToDashboard,
  type ForgeDashboardRun,
  type ForgeTraceLine,
  type RunSnapshot,
  type RunStatus,
  type RunSummary,
  type TraceLogSnapshot,
} from '@oma-forge/shared'

const MAX_TRACE_LINES = 500

type RunsListResponse = {
  readonly runs: readonly RunSummary[]
  readonly activeRunId: string | null
}

function appendTraceLine(
  lines: readonly ForgeTraceLine[],
  line: ForgeTraceLine,
): ForgeTraceLine[] {
  const next = [...lines, line]
  return next.length > MAX_TRACE_LINES ? next.slice(-MAX_TRACE_LINES) : next
}

async function fetchRunSnapshot(runId: string): Promise<RunSnapshot | null> {
  const res = await fetch(`/api/runs/${runId}`)
  return res.ok ? ((await res.json()) as RunSnapshot) : null
}

async function fetchRunTrace(runId: string): Promise<readonly ForgeTraceLine[]> {
  const res = await fetch(`/api/runs/${runId}/trace`)
  if (!res.ok) return []
  const body = (await res.json()) as TraceLogSnapshot
  return body.lines ?? []
}

export function useForgeRun() {
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [result, setResult] = useState<ForgeDashboardRun>(emptyDashboardRun)
  const [traceLines, setTraceLines] = useState<readonly ForgeTraceLine[]>([])
  const [runHistory, setRunHistory] = useState<readonly RunSummary[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [healthOk, setHealthOk] = useState<boolean | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const selectedRunIdRef = useRef<string | null>(null)
  selectedRunIdRef.current = selectedRunId

  const applySnapshot = useCallback((snapshot: RunSnapshot) => {
    setRunStatus(snapshot.status)
    setResult(runSnapshotToDashboard(snapshot))
    if (snapshot.id) setSelectedRunId(snapshot.id)
  }, [])

  const loadRun = useCallback(async (runId: string) => {
    const [snapshot, lines] = await Promise.all([
      fetchRunSnapshot(runId),
      fetchRunTrace(runId),
    ])
    if (snapshot) applySnapshot(snapshot)
    setTraceLines(lines)
    setSelectedRunId(runId)
  }, [applySnapshot])

  const refreshRunsList = useCallback(async () => {
    const res = await fetch('/api/runs')
    if (!res.ok) return
    const body = (await res.json()) as RunsListResponse
    setRunHistory(body.runs)
    setActiveRunId(body.activeRunId)
    return body
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const list = await refreshRunsList()
      if (cancelled) return

      const initialId = list?.activeRunId ?? list?.runs[0]?.id
      if (initialId) {
        await loadRun(initialId)
      } else {
        const currentRes = await fetch('/api/runs/current')
        if (currentRes.ok) {
          const snapshot = (await currentRes.json()) as RunSnapshot
          if (!cancelled) applySnapshot(snapshot)
        }
      }
    })()

    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { ok?: boolean } | null) => {
        if (!cancelled) setHealthOk(body?.ok === true)
      })
      .catch(() => {
        if (!cancelled) setHealthOk(false)
      })

    return () => {
      cancelled = true
    }
  }, [applySnapshot, loadRun, refreshRunsList])

  useEffect(() => {
    const source = new EventSource('/api/events')

    source.onmessage = (message) => {
      const event = parseForgeEvent(message.data)
      if (!event) return

      const selected = selectedRunIdRef.current

      if (event.type === 'run_snapshot') {
        const snapshot = event.data
        void refreshRunsList()
        if (!selected || snapshot.id === selected) {
          applySnapshot(snapshot)
        }
      }

      if (event.type === 'trace_line') {
        const line = event.data
        if (!selected || line.runId === selected) {
          setTraceLines((prev) => appendTraceLine(prev, line))
        }
      }
    }

    return () => {
      source.close()
    }
  }, [applySnapshot, refreshRunsList])

  const startRun = useCallback(
    async (goal?: string) => {
      setStartError(null)
      setIsStarting(true)
      try {
        const response = await fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: goal ?? DEFAULT_RUN_GOAL }),
        })
        const body = (await response.json()) as {
          ok?: boolean
          error?: string
          runId?: string
        }
        if (!response.ok) {
          setStartError(body.error ?? `request_failed_${response.status}`)
          return
        }
        if (body.runId) {
          setTraceLines([])
          setActiveRunId(body.runId)
          setSelectedRunId(body.runId)
          await loadRun(body.runId)
          await refreshRunsList()
        }
      } catch {
        setStartError('network_error')
      } finally {
        setIsStarting(false)
      }
    },
    [loadRun, refreshRunsList],
  )

  const cancelRun = useCallback(async () => {
    const runId = activeRunId ?? selectedRunId
    if (!runId) return

    setCancelError(null)
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/runs/${runId}/cancel`, { method: 'POST' })
      const body = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) {
        setCancelError(body.error ?? `request_failed_${response.status}`)
      } else {
        await refreshRunsList()
        await loadRun(runId)
      }
    } catch {
      setCancelError('network_error')
    } finally {
      setIsCancelling(false)
    }
  }, [activeRunId, loadRun, refreshRunsList, selectedRunId])

  const selectRun = useCallback(
    (runId: string) => {
      void loadRun(runId)
    },
    [loadRun],
  )

  return {
    runStatus,
    result,
    traceLines,
    runHistory,
    activeRunId,
    selectedRunId,
    healthOk,
    startError,
    cancelError,
    isStarting,
    isCancelling,
    startRun,
    cancelRun,
    selectRun,
  }
}
