import type { TeamConfig } from '@open-multi-agent/core'
import { oma } from '../oma.js'

export const FORGE_DEMO_TEAM_NAME = 'forge-demo'

export const forgeDemoTeamConfig: TeamConfig = {
  name: FORGE_DEMO_TEAM_NAME,
  agents: [
    {
      name: 'researcher',
      model: 'claude-opus-4-6',
      systemPrompt: 'You research topics thoroughly and report findings concisely.',
    },
    {
      name: 'engineer',
      model: 'claude-opus-4-6',
      systemPrompt: 'You implement technical tasks and write clear summaries.',
    },
  ],
  sharedMemory: true,
}

/** Demo team registered with the shared orchestrator at startup. */
export const forgeDemoTeam = oma.createTeam(FORGE_DEMO_TEAM_NAME, forgeDemoTeamConfig)
