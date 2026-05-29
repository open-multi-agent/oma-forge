import { OpenMultiAgent } from '@open-multi-agent/core'
import { bootstrapForgeWorkflow, type ForgeRunContext } from '@oma-forge/reporter'

const teamConfig = {
  name: 'forge-demo',
  agents: [
    {
      name: 'researcher',
      model: 'gemini-2.5-flash',
      provider: 'gemini' as const,
      systemPrompt: 'You research topics thoroughly and report findings concisely.',
    },
    {
      name: 'summary-writer',
      model: 'gemini-2.5-flash',
      provider: 'gemini' as const,
      systemPrompt: 'You write clear, concise executive summaries from research notes.',
    },
  ],
  sharedMemory: true,
} as const

/** Goal phrasing that triggers full coordinator decomposition (not short-circuit). */
function teamGoal(userGoal: string): string {
  return [
    'Complete this two-step research pipeline.',
    `Topic: ${userGoal}`,
    'Step 1 — Research: gather key facts and sources (assign to researcher).',
    'Step 2 — Summarize: write a clear executive summary of the research (assign to summary-writer).',
  ].join('\n')
}

/** Built-in demo workflow — tools and MCPs are wired here, not in Forge. */
export default async function run(ctx: ForgeRunContext): Promise<void> {
  const { goal, abortSignal, reporter } = ctx

  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY
  if (!apiKey) {
    reporter.fail(
      'Missing GOOGLE_API_KEY or GEMINI_API_KEY — add one to .env at the repo root or export it in your shell.',
    )
    process.exit(1)
  }

  const oma = new OpenMultiAgent({
    defaultProvider: 'gemini',
    defaultApiKey: apiKey,
    defaultModel: 'gemini-2.5-flash',
    onProgress: reporter.onProgress,
    onTrace: reporter.onTrace,
    onPlanReady: reporter.onPlanReady,
    onAgentStream: reporter.onAgentStream,
  })

  const team = oma.createTeam(teamConfig.name, teamConfig)
  const result = await oma.runTeam(team, teamGoal(goal), {
    abortSignal,
    coordinator: {
      instructions:
        'Always decompose into at least two sequential tasks: one for researcher, one for summary-writer.',
    },
  })
  reporter.finish(result)
}

void bootstrapForgeWorkflow(run)
