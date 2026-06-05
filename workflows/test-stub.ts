import { getForgeReporter } from '@oma-forge/reporter'

/** Minimal workflow for server integration tests (no LLM calls). */
export default async function main() {
  const goal = process.env.FORGE_GOAL ?? ''
  const reporter = getForgeReporter()

  reporter.onProgress({ type: 'task_start', task: 't1', agent: 'worker' })
  reporter.onTrace({
    type: 'tool_call',
    runId: process.env.FORGE_RUN_ID!,
    startMs: 0,
    endMs: 1,
    durationMs: 1,
    agent: 'worker',
    taskId: 't1',
    tool: 'echo',
    isError: false,
    input: { message: 'hello' },
    output: 'hello',
  })
  reporter.onProgress({ type: 'task_complete', task: 't1', agent: 'worker' })

  return {
    success: true,
    goal,
    tasks: [
      {
        id: 't1',
        title: 'Stub task',
        assignee: 'worker',
        status: 'completed',
        dependsOn: [],
      },
    ],
    agentResults: new Map(),
    totalTokenUsage: { input_tokens: 0, output_tokens: 0 },
  }
}
