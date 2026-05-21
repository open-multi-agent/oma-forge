import type { TeamRunResult } from '../types/team-run.ts'

const now = Date.now()

export const demoTeamRun: TeamRunResult = {
  goal: 'Build a REST API for multi-agent task orchestration with live DAG visualization',
  tasks: [
    {
      id: 'research',
      title: 'Research requirements',
      assignee: 'analyst',
      status: 'completed',
      dependsOn: [],
      metrics: {
        startMs: now - 120_000,
        endMs: now - 95_000,
        durationMs: 25_000,
        tokenUsage: { input_tokens: 1842, output_tokens: 956 },
        toolCalls: [{ name: 'web_search' }],
      },
    },
    {
      id: 'design',
      title: 'Design API surface',
      assignee: 'architect',
      status: 'completed',
      dependsOn: ['research'],
      metrics: {
        startMs: now - 90_000,
        endMs: now - 52_000,
        durationMs: 38_000,
        tokenUsage: { input_tokens: 3201, output_tokens: 1420 },
        toolCalls: [],
      },
    },
    {
      id: 'implement',
      title: 'Implement orchestrator routes',
      assignee: 'engineer',
      status: 'in_progress',
      dependsOn: ['design'],
      metrics: {
        startMs: now - 48_000,
        endMs: now,
        durationMs: 48_000,
        tokenUsage: { input_tokens: 5102, output_tokens: 2894 },
        toolCalls: [{ name: 'read_file' }, { name: 'edit_file' }],
      },
    },
    {
      id: 'tests',
      title: 'Write integration tests',
      assignee: 'qa',
      status: 'pending',
      dependsOn: ['implement'],
    },
    {
      id: 'docs',
      title: 'Publish developer docs',
      assignee: 'writer',
      status: 'blocked',
      dependsOn: ['implement'],
    },
    {
      id: 'synthesize',
      title: 'Synthesize report',
      assignee: 'synthesizer',
      status: 'blocked',
      dependsOn: ['tests', 'docs'],
    },
  ],
}
