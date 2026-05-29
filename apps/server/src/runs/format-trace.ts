import type { OrchestratorEvent, StreamEvent, TraceEvent } from '@open-multi-agent/core'
import type { ForgeTraceLine, TraceLineLevel } from '@oma-forge/shared'

function truncate(text: string, max = 160): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function formatToolOutput(output: string): string {
  const preview = truncate(output.replace(/\s+/g, ' '))
  return preview.length > 0 ? `: ${preview}` : ''
}

function line(
  runId: string,
  level: TraceLineLevel,
  message: string,
  meta?: { readonly agent?: string; readonly taskId?: string },
): ForgeTraceLine {
  return {
    runId,
    at: Date.now(),
    level,
    message,
    ...meta,
  }
}

export function formatProgressEvent(
  runId: string,
  event: OrchestratorEvent,
): ForgeTraceLine | null {
  const taskId = event.task
  const agent = event.agent

  switch (event.type) {
    case 'task_start':
      return line(runId, 'info', `Task started: ${taskId ?? 'unknown'}`, { agent, taskId })
    case 'task_complete':
      return line(runId, 'info', `Task completed: ${taskId ?? 'unknown'}`, { agent, taskId })
    case 'task_skipped':
      return line(runId, 'warn', `Task skipped: ${taskId ?? 'unknown'}`, { agent, taskId })
    case 'task_retry':
      return line(runId, 'warn', `Task retry: ${taskId ?? 'unknown'}`, { agent, taskId })
    case 'agent_start':
      return line(runId, 'info', `Agent started: ${agent ?? 'unknown'}`, { agent, taskId })
    case 'agent_complete': {
      const data = event.data as
        | { result?: { success?: boolean; output?: string } }
        | undefined
      const failed = data?.result?.success === false
      const detail =
        failed && typeof data?.result?.output === 'string'
          ? truncate(data.result.output.replace(/\s+/g, ' '))
          : ''
      return line(
        runId,
        failed ? 'error' : 'info',
        `Agent finished: ${agent ?? 'unknown'}${detail ? ` — ${detail}` : ''}`,
        { agent, taskId },
      )
    }
    case 'budget_exceeded':
      return line(runId, 'error', 'Token budget exceeded', { agent, taskId })
    case 'error':
      return line(
        runId,
        'error',
        typeof event.data === 'string' ? event.data : 'Orchestrator error',
        { agent, taskId },
      )
    case 'message':
      return line(runId, 'info', typeof event.data === 'string' ? event.data : 'Message', {
        agent,
        taskId,
      })
    default:
      return null
  }
}

export function formatTraceEvent(runId: string, event: TraceEvent): ForgeTraceLine | null {
  const meta = { agent: event.agent, taskId: event.taskId }

  switch (event.type) {
    case 'llm_call':
      return line(
        runId,
        'info',
        `LLM ${event.phase ?? 'turn'} #${event.turn} — ${event.tokens.input_tokens} in / ${event.tokens.output_tokens} out`,
        meta,
      )
    case 'tool_call': {
      const suffix = event.isError ? ' (failed)' : formatToolOutput(event.output)
      return line(
        runId,
        event.isError ? 'error' : 'info',
        `Tool ${event.tool}${suffix}`,
        meta,
      )
    }
    case 'task':
      return line(
        runId,
        event.success ? 'info' : 'error',
        `Task "${event.taskTitle}" ${event.success ? 'done' : 'failed'} (${event.retries} retries)`,
        { ...meta, taskId: event.taskId },
      )
    case 'agent':
      return line(
        runId,
        'info',
        `Agent run done — ${event.turns} turns, ${event.toolCalls} tool calls`,
        meta,
      )
    case 'plan_ready':
      return line(
        runId,
        'info',
        `Plan ready: ${event.taskCount} tasks (${event.approved ? 'approved' : 'rejected'})`,
        meta,
      )
    case 'agent_stream':
      return null
    default:
      return null
  }
}

export function formatStreamEvent(
  runId: string,
  agent: string,
  event: StreamEvent,
  taskId?: string,
): ForgeTraceLine | null {
  if (event.type === 'text' && typeof event.data === 'string' && event.data.length > 0) {
    return line(runId, 'stream', event.data, { agent, taskId })
  }
  if (event.type === 'tool_use') {
    const data = event.data as { name?: string } | undefined
    const name = data?.name ?? 'tool'
    return line(runId, 'info', `Streaming tool: ${name}`, { agent, taskId })
  }
  if (event.type === 'error') {
    const message =
      event.data instanceof Error ? event.data.message : 'Agent stream error'
    return line(runId, 'error', message, { agent, taskId })
  }
  return null
}
