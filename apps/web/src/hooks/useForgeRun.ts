import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_RUN_GOAL,
  emptyDashboardRun,
  parseForgeEvent,
  runSnapshotToDashboard,
  type ForgeDashboardRun,
  type ForgeTraceLine,
  type RunHealth,
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
  const [runHealth, setRunHealth] = useState<RunHealth | undefined>(undefined)
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
  const [workflowPath, setWorkflowPath] = useState('')
  const [goal, setGoal] = useState(DEFAULT_RUN_GOAL)

  const selectedRunIdRef = useRef<string | null>(null)
  const activeRunIdRef = useRef<string | null>(null)
  selectedRunIdRef.current = selectedRunId
  activeRunIdRef.current = activeRunId

  const applySnapshot = useCallback((snapshot: RunSnapshot) => {
    setRunStatus(snapshot.status)
    setRunHealth(snapshot.health)
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

    fetch('/api/workflow')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { defaultWorkflowPath?: string; defaultGoal?: string } | null) => {
        if (cancelled) return
        if (body?.defaultWorkflowPath) setWorkflowPath(body.defaultWorkflowPath)
        if (body?.defaultGoal) setGoal(body.defaultGoal)
      })
      .catch(() => {})

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
        const active = activeRunIdRef.current
        if (!selected || snapshot.id === selected || snapshot.id === active) {
          applySnapshot(snapshot)
        }
      }

      if (event.type === 'trace_line') {
        const line = event.data
        const active = activeRunIdRef.current
        if (!selected || line.runId === selected || line.runId === active) {
          setTraceLines((prev) => appendTraceLine(prev, line))
        }
      }
    }

    return () => {
      source.close()
    }
  }, [applySnapshot, refreshRunsList])

  const startRun = useCallback(
    async (options?: { goal?: string; workflowPath?: string }) => {
      setStartError(null)
      setIsStarting(true)
      const runGoal = options?.goal ?? goal
      const path = options?.workflowPath ?? workflowPath
      if (runGoal.trim().length === 0) {
        setStartError('empty_goal')
        setIsStarting(false)
        return
      }
      try {
        const response = await fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: runGoal.trim(),
            workflowPath: path.trim().length > 0 ? path : undefined,
          }),
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
          setRunStatus('running')
          setRunHealth({ ok: true })
          setResult({ goal: runGoal.trim(), tasks: [] })
          setActiveRunId(body.runId)
          setSelectedRunId(body.runId)
          await refreshRunsList()
        }
      } catch {
        setStartError('network_error')
      } finally {
        setIsStarting(false)
      }
    },
    [goal, loadRun, refreshRunsList, workflowPath],
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
    runHealth,
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
    workflowPath,
    setWorkflowPath,
    goal,
    setGoal,
    startRun,
    cancelRun,
    selectRun,
  }
}
