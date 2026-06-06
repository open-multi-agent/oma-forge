import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** Nearest directory with a package.json, else the workflow file's directory. */
export function resolveProjectRoot(workflowPath: string): string {
  let dir = dirname(resolve(workflowPath))

  while (true) {
    if (existsSync(join(dir, 'package.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return dirname(resolve(workflowPath))
}
