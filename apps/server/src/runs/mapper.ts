import type { Task, TaskExecutionRecord } from '@oma-forge/shared'

export function taskToRecord(task: Task): TaskExecutionRecord {
  return {
    id: task.id,
    title: task.title,
    assignee: task.assignee,
    status: task.status,
    dependsOn: task.dependsOn ?? [],
  }
}
