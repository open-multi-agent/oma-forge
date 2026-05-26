import { useCallback, useEffect, useState } from 'react'
import { parseForgeEvent } from '../types/forge-events.ts'
import type { RunSnapshot, RunStatus } from '../types/run-snapshot.ts'
import type { TeamRunResult } from '../types/team-run.ts'
import type { ForgeTraceLine, TraceLogSnapshot } from '../types/trace.ts'
import { DEFAULT_RUN_GOAL } from '../lib/constants.ts'

const MAX_TRACE_LINES = 500

function snapshotToResult(snapshot: RunSnapshot): TeamRunResult {
  return {
    goal: snapshot.goal ?? '',
    tasks: snapshot.tasks,
  }
}

function appendTraceLine(
  lines: readonly ForgeTraceLine[],
  line: ForgeTraceLine,
): ForgeTraceLine[] {
  const next = [...lines, line]
  return next.length > MAX_TRACE_LINES ? next.slice(-MAX_TRACE_LINES) : next
}

export function useForgeRun() {
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [result, setResult] = useState<TeamRunResult>({ goal: '', tasks: [] })
  const [traceLines, setTraceLines] = useState<readonly ForgeTraceLine[]>([])
  const [healthOk, setHealthOk] = useState<boolean | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const applySnapshot = useCallback((snapshot: RunSnapshot) => {
    setRunStatus(snapshot.status)
    setResult(snapshotToResult(snapshot))
  }, [])

  const appendLine = useCallback((line: ForgeTraceLine) => {
    setTraceLines((prev) => appendTraceLine(prev, line))
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch('/api/runs/current')
      .then((res) => (res.ok ? res.json() : null))
      .then((snapshot: RunSnapshot | null) => {
        if (!cancelled && snapshot) applySnapshot(snapshot)
      })
      .catch(() => {})

    fetch('/api/runs/trace')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: TraceLogSnapshot | null) => {
        if (!cancelled && body?.lines) setTraceLines(body.lines)
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
  }, [applySnapshot])

  useEffect(() => {
    const source = new EventSource('/api/events')

    source.onmessage = (message) => {
      const event = parseForgeEvent(message.data)
      if (event?.type === 'run_snapshot') {
        applySnapshot(event.data)
      }
      if (event?.type === 'trace_line') {
        appendLine(event.data)
      }
    }

    return () => {
      source.close()
    }
  }, [applySnapshot, appendLine])

  const startRun = useCallback(async (goal?: string) => {
    setStartError(null)
    setIsStarting(true)
    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal ?? DEFAULT_RUN_GOAL }),
      })
      const body = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) {
        setStartError(body.error ?? `request_failed_${response.status}`)
      } else {
        setTraceLines([])
      }
    } catch {
      setStartError('network_error')
    } finally {
      setIsStarting(false)
    }
  }, [])

  return {
    runStatus,
    result,
    traceLines,
    healthOk,
    startError,
    isStarting,
    startRun,
  }
}
