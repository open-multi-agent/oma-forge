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
import { taskToRecord } from './mapper.js'
import { applyTaskPatch, taskPatchFromProgressEvent, taskRecordFromResult } from './task-progress.js'
import { TraceLog } from './trace-log.js'

const TERMINAL_STATUSES = new Set<RunStatus>(['completed', 'failed', 'cancelled'])

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
    if (!event.task) return

    const patch = taskPatchFromProgressEvent(event)
    if (!patch) return

    this.tasks = applyTaskPatch(this.tasks, patch)
  }

  finish(result: TeamRunResult): void {
    this.finishedAt = Date.now()
    if (result.goal !== undefined) {
      this.goal = result.goal
    }
    if (result.tasks !== undefined) {
      this.tasks = result.tasks.map(taskRecordFromResult)
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

}
