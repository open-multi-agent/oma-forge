import type {
  OrchestratorEvent,
  Task,
  TaskExecutionMetrics,
  TaskExecutionRecord,
  TaskStatus,
} from '@oma-forge/shared'
import { taskToRecord } from './mapper.js'

function isTaskData(data: unknown): data is Task {
  if (typeof data !== 'object' || data === null) return false
  return 'id' in data && 'title' in data && 'status' in data
}

const statusFromEventType: Partial<Record<OrchestratorEvent['type'], TaskStatus>> = {
  task_complete: 'completed',
  task_skipped: 'skipped',
  error: 'failed',
  task_start: 'in_progress',
  task_retry: 'in_progress',
}

/** Partial task fields carried by a single oma-core progress event. */
export type TaskRecordPatch = {
  readonly id: string
  readonly title?: string
  readonly assignee?: string
  readonly status?: TaskStatus
  readonly dependsOn?: readonly string[]
  readonly metrics?: TaskExecutionMetrics
}

/** Maps an oma-core progress event to task fields (only what the event carries). */
export function taskPatchFromProgressEvent(event: OrchestratorEvent): TaskRecordPatch | null {
  const taskId = event.task
  if (!taskId) return null

  if (isTaskData(event.data) && event.data.id === taskId) {
    const record = taskToRecord(event.data)
    return {
      ...record,
      assignee: record.assignee ?? event.agent,
    }
  }

  const status = statusFromEventType[event.type]
  if (!status) return null

  return {
    id: taskId,
    ...(event.agent !== undefined ? { assignee: event.agent } : {}),
    status,
  }
}

/** Maps final oma-core task records for the run snapshot (no field backfill). */
export function taskRecordFromResult(task: TaskExecutionRecord): TaskExecutionRecord {
  return {
    id: task.id,
    title: task.title,
    assignee: task.assignee,
    status: task.status,
    dependsOn: task.dependsOn ?? [],
    metrics: task.metrics,
  }
}

export function applyTaskPatch(
  tasks: readonly TaskExecutionRecord[],
  patch: TaskRecordPatch,
): TaskExecutionRecord[] {
  const index = tasks.findIndex((task) => task.id === patch.id)
  if (index === -1) {
    return [
      ...tasks,
      {
        id: patch.id,
        title: patch.title ?? patch.id,
        assignee: patch.assignee,
        status: patch.status ?? 'pending',
        dependsOn: patch.dependsOn ?? [],
        ...(patch.metrics !== undefined ? { metrics: patch.metrics } : {}),
      },
    ]
  }

  return tasks.map((task, i) => {
    if (i !== index) return task
    return {
      ...task,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.dependsOn !== undefined ? { dependsOn: patch.dependsOn } : {}),
      ...(patch.metrics !== undefined ? { metrics: patch.metrics } : {}),
    }
  })
}
