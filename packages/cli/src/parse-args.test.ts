import { describe, expect, it } from 'vitest'
import { parseArgs } from './parse-args.js'

describe('parseArgs', () => {
  it('parses workflow path and flags', () => {
    expect(parseArgs(['./wf.ts', '--no-open', '--port', '4000', '--web-port', '6000'])).toEqual({
      workflowPath: './wf.ts',
      openBrowser: false,
      apiPort: 4000,
      webPort: 6000,
      help: false,
    })
  })

  it('sets help flag', () => {
    expect(parseArgs(['--help']).help).toBe(true)
  })

  it('rejects unknown options', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown option/)
  })
})
