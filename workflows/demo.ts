import { OpenMultiAgent } from '@open-multi-agent/core'
import { forgeAbortSignal, forgeHooks } from '@oma-forge/reporter'

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
export default async function main() {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'Missing GOOGLE_API_KEY or GEMINI_API_KEY — add one to .env at the project root or export it in your shell.',
    )
  }

  const goal = process.env.FORGE_GOAL ?? ''

  const oma = new OpenMultiAgent({
    defaultProvider: 'gemini',
    defaultApiKey: apiKey,
    defaultModel: 'gemini-2.5-flash',
    // TODO: using existing OMA hooks to stream progress and trace to Forge may block the developer from using it in their workflow.
    ...forgeHooks(),
  })

  const team = oma.createTeam(teamConfig.name, teamConfig)
  return oma.runTeam(team, teamGoal(goal), {
    abortSignal: forgeAbortSignal(),
    coordinator: {
      instructions:
        'Always decompose into at least two sequential tasks: one for researcher, one for summary-writer.',
    },
  })
}
