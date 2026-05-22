import type { RunSnapshot } from './run-snapshot.ts'

export type ForgeEvent =
  | { readonly type: 'connected'; readonly data: { readonly ok: true } }
  | { readonly type: 'run_snapshot'; readonly data: RunSnapshot }
  | { readonly type: 'progress'; readonly data: { readonly type: string } }

export function parseForgeEvent(raw: string): ForgeEvent | null {
  try {
    return JSON.parse(raw) as ForgeEvent
  } catch {
    return null
  }
}
