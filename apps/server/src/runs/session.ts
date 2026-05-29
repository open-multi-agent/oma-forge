import type {
  OrchestratorEvent,
  RunSnapshot,
  RunStatus,
  RunSummary,
  Task,
  TaskExecutionRecord,
  TeamRunResult,
} from '@oma-forge/shared'
import { TraceLog } from './trace-log.js'
import { taskToRecord } from './mapper.js'

const TERMINAL_STATUSES = new Set<RunStatus>(['completed', 'failed', 'cancelled'])

export class RunSession {
  private status: RunStatus = 'running'
  private readonly trace = new TraceLog()
  private tasks: TaskExecutionRecord[] = []
  private finishedAt: number | undefined

  private goal: string

  constructor(
    readonly id: string,
    goal: string,
    readonly startedAt: number = Date.now(),
    readonly abortController: AbortController = new AbortController(),
  ) {
    this.goal = goal
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
    this.tasks = tasks.map(taskToRecord)
  }

  applyProgress(event: OrchestratorEvent): void {
    if (!event.task) return

    this.tasks = this.tasks.map((task) => {
      if (task.id !== event.task) return task

      switch (event.type) {
        case 'task_start':
        case 'task_retry':
          return { ...task, status: 'in_progress' }
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
    this.status = result.success ? 'completed' : 'failed'
    if (result.goal !== undefined) {
      this.goal = result.goal
    }
    if (result.tasks !== undefined) {
      this.tasks = [...result.tasks]
    }
  }

  fail(): void {
    this.finishedAt = Date.now()
    this.status = 'failed'
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
      goal: this.goal,
      tasks: this.tasks,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    }
  }

  toSummary(): RunSummary {
    return {
      id: this.id,
      status: this.status as Exclude<RunStatus, 'idle'>,
      goal: this.goal,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    }
  }
}
