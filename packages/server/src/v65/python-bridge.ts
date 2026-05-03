import { spawnSync } from 'node:child_process'

export interface PythonProbeResult {
  available: boolean
  version: string | null // e.g. "3.11.4" or null
}

export function probePython(): PythonProbeResult {
  const r = spawnSync('python3', ['--version'], { timeout: 1000, encoding: 'utf-8' })
  if (r.status !== 0) return { available: false, version: null }
  const match = /Python (\d+\.\d+\.\d+)/.exec(r.stdout || r.stderr || '')
  if (!match) return { available: false, version: null }
  const [, versionStr] = match
  const [major, minor] = versionStr.split('.').map(Number)
  const available = major > 3 || (major === 3 && minor >= 11)
  return { available, version: versionStr }
}
