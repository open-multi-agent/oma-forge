import type { ForgeTraceLine, TraceLogSnapshot } from '@oma-forge/shared'

const DEFAULT_MAX_LINES = 500

export class TraceLog {
  private lines: ForgeTraceLine[] = []

  constructor(private readonly maxLines = DEFAULT_MAX_LINES) {}

  clear(): void {
    this.lines = []
  }

  append(entry: ForgeTraceLine): ForgeTraceLine {
    this.lines.push(entry)
    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(-this.maxLines)
    }
    return entry
  }

  toSnapshot(): TraceLogSnapshot {
    return { lines: this.lines }
  }
}

export const traceLog = new TraceLog()
