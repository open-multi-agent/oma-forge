import type {
  OrchestratorEvent,
  Task,
  TaskExecutionRecord,
  TeamRunResult,
} from '@open-multi-agent/core'
import { taskToRecord } from './mapper.js'
import type { RunSnapshot, RunStatus } from './types.js'

export class CurrentRun {
  private status: RunStatus = 'idle'
  private goal: string | undefined
  private tasks: TaskExecutionRecord[] = []

  reset(): void {
    this.status = 'idle'
    this.goal = undefined
    this.tasks = []
  }

  isRunning(): boolean {
    return this.status === 'running'
  }

  begin(goal: string): void {
    this.goal = goal
    this.tasks = []
    this.status = 'running'
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
    this.status = result.success ? 'completed' : 'failed'
    if (result.goal !== undefined) {
      this.goal = result.goal
    }
    if (result.tasks !== undefined) {
      this.tasks = [...result.tasks]
    }
  }

  fail(): void {
    this.status = 'failed'
  }

  toSnapshot(): RunSnapshot {
    return {
      status: this.status,
      goal: this.goal,
      tasks: this.tasks,
    }
  }
}

export const currentRun = new CurrentRun()
