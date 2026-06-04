import {
  assessRunCompletion,
  type OrchestratorEvent,
  type RunHealth,
  type RunSnapshot,
  type RunStatus,
  type RunSummary,
  type Task,
  type TaskExecutionRecord,
  type TeamRunResult,
} from '@oma-forge/shared'
import { TraceLog } from './trace-log.js'
import { taskToRecord } from './mapper.js'

const TERMINAL_STATUSES = new Set<RunStatus>(['completed', 'failed', 'cancelled'])
const SHORT_CIRCUIT_TASK_ID = 'short-circuit'

function taskFromProgressData(
  taskId: string,
  event: OrchestratorEvent,
  status: TaskExecutionRecord['status'],
): TaskExecutionRecord {
  const taskData = event.data as Task | undefined
  return {
    id: taskId,
    title: taskData?.title ?? taskId,
    assignee: event.agent ?? taskData?.assignee,
    status,
    dependsOn: taskData?.dependsOn ?? [],
  }
}

function shortCircuitResultFailed(event: OrchestratorEvent): boolean {
  const data = event.data as { result?: { success?: boolean } } | undefined
  return data?.result?.success === false
}

export class RunSession {
  private status: RunStatus = 'running'
  private health: RunHealth = { ok: true }
  private readonly trace = new TraceLog()
  private tasks: TaskExecutionRecord[] = []
  private finishedAt: number | undefined
  private lastActivityAt: number

  private goal: string
  private workflowPath: string | undefined

  constructor(
    readonly id: string,
    goal: string,
    workflowPath?: string,
    readonly startedAt: number = Date.now(),
    readonly abortController: AbortController = new AbortController(),
  ) {
    this.goal = goal
    this.workflowPath = workflowPath
    this.lastActivityAt = startedAt
  }

  touchActivity(at: number = Date.now()): void {
    this.lastActivityAt = at
  }

  isRunning(): boolean {
    return this.status === 'running'
  }

  isTerminal(): boolean {
    return TERMINAL_STATUSES.has(this.status)
  }

  get abortSignal(): AbortSignal {
    return this.abortController.signal
  }

  setPlan(tasks: readonly Task[]): void {
    this.setPlanRecords(tasks.map(taskToRecord))
  }

  setPlanRecords(tasks: TaskExecutionRecord[]): void {
    this.tasks = tasks
  }

  applyProgress(event: OrchestratorEvent): void {
    if (event.type === 'agent_start' && event.agent && !event.task) {
      const data = event.data as { phase?: string } | undefined
      if (data?.phase === 'short-circuit') {
        this.upsertTask({
          id: SHORT_CIRCUIT_TASK_ID,
          title: `Short-circuit: ${event.agent}`,
          assignee: event.agent,
          status: 'in_progress',
          dependsOn: [],
        })
      }
      return
    }

    if (event.type === 'agent_complete' && !event.task && event.agent) {
      const data = event.data as { phase?: string } | undefined
      if (data?.phase === 'short-circuit') {
        this.upsertTask({
          id: SHORT_CIRCUIT_TASK_ID,
          title: `Short-circuit: ${event.agent}`,
          assignee: event.agent,
          status: shortCircuitResultFailed(event) ? 'failed' : 'completed',
          dependsOn: [],
        })
      }
      return
    }

    if (!event.task) return

    if (event.type === 'task_start' || event.type === 'task_retry') {
      this.upsertTask(taskFromProgressData(event.task, event, 'in_progress'))
      return
    }

    if (!this.tasks.some((task) => task.id === event.task)) {
      this.upsertTask(taskFromProgressData(event.task, event, 'pending'))
    }

    this.tasks = this.tasks.map((task) => {
      if (task.id !== event.task) return task

      switch (event.type) {
        case 'task_complete':
          return { ...task, status: 'completed' }
        case 'task_skipped':
          return { ...task, status: 'skipped' }
        case 'error':
          return { ...task, status: 'failed' }
        default:
          return task
      }
    })
  }

  finish(result: TeamRunResult): void {
    this.finishedAt = Date.now()
    if (result.goal !== undefined) {
      this.goal = result.goal
    }
    if (result.tasks !== undefined) {
      const prior = new Map(this.tasks.map((task) => [task.id, task]))
      this.tasks = result.tasks.map((task) => ({
        ...task,
        dependsOn:
          (task.dependsOn?.length ?? 0) > 0
            ? task.dependsOn
            : (prior.get(task.id)?.dependsOn ?? []),
      }))
    }

    const completionHealth = assessRunCompletion(result, this.trace.length)
    this.health = completionHealth
    if (!completionHealth.ok) {
      this.status = 'failed'
      return
    }

    this.status = result.success ? 'completed' : 'failed'
  }

  fail(health?: RunHealth): void {
    this.finishedAt = Date.now()
    this.status = 'failed'
    if (health) this.health = health
  }

  setHealth(health: RunHealth): void {
    this.health = health
  }

  cancel(): void {
    if (!this.isRunning()) return
    this.abortController.abort()
    this.finishedAt = Date.now()
    this.status = 'cancelled'
  }

  appendTrace(entry: import('@oma-forge/shared').ForgeTraceLine): void {
    this.trace.append(entry)
  }

  traceSnapshot(): import('@oma-forge/shared').TraceLogSnapshot {
    return this.trace.toSnapshot()
  }

  toSnapshot(): RunSnapshot {
    return {
      id: this.id,
      status: this.status,
      health: this.health,
      goal: this.goal,
      workflowPath: this.workflowPath,
      tasks: this.tasks,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      lastActivityAt: this.lastActivityAt,
    }
  }

  toSummary(): RunSummary {
    return {
      id: this.id,
      status: this.status as Exclude<RunStatus, 'idle'>,
      health: this.health,
      goal: this.goal,
      workflowPath: this.workflowPath,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    }
  }

  private upsertTask(record: TaskExecutionRecord): void {
    const index = this.tasks.findIndex((task) => task.id === record.id)
    if (index === -1) {
      this.tasks = [...this.tasks, record]
      return
    }
    this.tasks = this.tasks.map((task, i) => (i === index ? { ...task, ...record } : task))
  }
}
