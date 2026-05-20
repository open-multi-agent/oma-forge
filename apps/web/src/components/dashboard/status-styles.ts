import type { TaskExecutionRecord, TaskStatus } from '../../types/team-run.ts'

export type StatusStyle = {
  readonly border: string
  readonly icon: string
  readonly iconColor: string
  readonly container: string
  readonly statusColor: string
  readonly chip: string
  readonly spin?: boolean
}

export const statusStyles: Record<TaskStatus, StatusStyle> = {
  completed: {
    border: 'border-tertiary',
    icon: 'check_circle',
    iconColor: 'text-tertiary',
    container: 'bg-surface-container-lowest node-active-glow',
    statusColor: 'text-on-surface-variant',
    chip: 'STABLE',
  },
  failed: {
    border: 'border-error',
    icon: 'error',
    iconColor: 'text-error',
    container: 'bg-surface-container-lowest',
    statusColor: 'text-error',
    chip: 'FAILED',
  },
  blocked: {
    border: 'border-outline',
    icon: 'lock',
    iconColor: 'text-outline',
    container: 'bg-surface-container-low opacity-60 grayscale',
    statusColor: 'text-on-surface-variant',
    chip: 'BLOCKED',
  },
  skipped: {
    border: 'border-outline',
    icon: 'skip_next',
    iconColor: 'text-outline',
    container: 'bg-surface-container-low opacity-60',
    statusColor: 'text-on-surface-variant',
    chip: 'SKIPPED',
  },
  in_progress: {
    border: 'border-secondary',
    icon: 'sync',
    iconColor: 'text-secondary',
    container:
      'bg-surface-container-low node-active-glow border border-outline-variant/20 shadow-[0_0_20px_rgba(253,192,3,0.1)]',
    statusColor: 'text-secondary',
    chip: 'ACTIVE_STREAM',
    spin: true,
  },
  pending: {
    border: 'border-outline',
    icon: 'hourglass_empty',
    iconColor: 'text-outline',
    container: 'bg-surface-container-low opacity-60 grayscale',
    statusColor: 'text-on-surface-variant',
    chip: 'WAITING',
  },
}

export function durationText(task: TaskExecutionRecord): string {
  const ms = task.metrics?.durationMs ?? 0
  const seconds = Math.max(0, ms / 1000).toFixed(1)
  return task.status === 'completed' ? `DONE (${seconds}s)` : task.status.toUpperCase()
}
