import type {
  AgentRunResult,
  OrchestratorEvent,
  StreamEvent,
  TaskExecutionRecord,
  TaskStatus,
  TeamRunResult,
  TokenUsage,
  TraceEvent,
} from '@open-multi-agent/core'

/** Prefix for NDJSON lines emitted by workflow subprocesses. */
export const FORGE_PROTOCOL_PREFIX = '__FORGE__'

export type ForgePlanTask = {
  readonly id: string
  readonly title: string
  readonly assignee?: string
  readonly status: TaskStatus
  readonly dependsOn?: readonly string[]
}

/** JSON-safe team run result (Map → plain object). */
export type SerializedTeamRunResult = {
  readonly success: boolean
  readonly goal?: string
  readonly tasks?: readonly TaskExecutionRecord[]
  readonly planOnly?: boolean
  readonly agentResults: Record<string, AgentRunResult>
  readonly totalTokenUsage: TokenUsage
}

export type ForgeWorkflowEvent =
  | { readonly type: 'progress'; readonly runId: string; readonly data: OrchestratorEvent }
  | { readonly type: 'trace'; readonly runId: string; readonly data: TraceEvent }
  | { readonly type: 'plan'; readonly runId: string; readonly data: { readonly tasks: readonly ForgePlanTask[] } }
  | {
      readonly type: 'agent_stream'
      readonly runId: string
      readonly agent: string
      readonly data: StreamEvent
    }
  | { readonly type: 'result'; readonly runId: string; readonly data: SerializedTeamRunResult }
  | { readonly type: 'error'; readonly runId: string; readonly data: { readonly message: string } }

export function encodeForgeEvent(event: ForgeWorkflowEvent): string {
  return `${FORGE_PROTOCOL_PREFIX}${JSON.stringify(event)}`
}

export function parseForgeWorkflowLine(line: string): ForgeWorkflowEvent | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith(FORGE_PROTOCOL_PREFIX)) return null
  try {
    return JSON.parse(trimmed.slice(FORGE_PROTOCOL_PREFIX.length)) as ForgeWorkflowEvent
  } catch {
    return null
  }
}

export function serializeTeamRunResult(result: TeamRunResult): SerializedTeamRunResult {
  return {
    success: result.success,
    goal: result.goal,
    tasks: result.tasks,
    planOnly: result.planOnly,
    agentResults: Object.fromEntries(result.agentResults),
    totalTokenUsage: result.totalTokenUsage,
  }
}

export function deserializeTeamRunResult(data: SerializedTeamRunResult): TeamRunResult {
  return {
    success: data.success,
    goal: data.goal,
    tasks: data.tasks,
    planOnly: data.planOnly,
    agentResults: new Map(Object.entries(data.agentResults)),
    totalTokenUsage: data.totalTokenUsage,
  }
}
