import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { atomicWrite, WriteFailedError } from './atomic-write.js'

describe('atomicWrite', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-write-test-')))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes content to dest and leaves no tmp file behind', async () => {
    const destPath = path.join(tmpDir, 'output.txt')
    await atomicWrite(destPath, 'hello world')

    expect(fs.readFileSync(destPath, 'utf-8')).toBe('hello world')

    // No leftover .tmp files
    const entries = fs.readdirSync(tmpDir)
    expect(entries.filter((e) => e.endsWith('.tmp'))).toHaveLength(0)
  })

  it('throws WriteFailedError on nonexistent parent dir and leaves no tmp file', async () => {
    const destPath = path.join(tmpDir, 'nonexistent', 'deep', 'output.txt')

    await expect(atomicWrite(destPath, 'content')).rejects.toBeInstanceOf(WriteFailedError)

    // No leftover .tmp files anywhere in tmpDir
    const checkTmp = (dir: string): string[] => {
      if (!fs.existsSync(dir)) return []
      return fs.readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry)
        const stat = fs.statSync(full)
        return stat.isDirectory() ? checkTmp(full) : full.endsWith('.tmp') ? [full] : []
      })
    }
    expect(checkTmp(tmpDir)).toHaveLength(0)
  })

  it('concurrent calls on same dest each get unique tmp suffix and all succeed', async () => {
    const destPath = path.join(tmpDir, 'shared.txt')

    // Run 5 concurrent writes
    await Promise.all([
      atomicWrite(destPath, 'write-1'),
      atomicWrite(destPath, 'write-2'),
      atomicWrite(destPath, 'write-3'),
      atomicWrite(destPath, 'write-4'),
      atomicWrite(destPath, 'write-5'),
    ])

    // dest exists and has one of the written values
    const content = fs.readFileSync(destPath, 'utf-8')
    expect(['write-1', 'write-2', 'write-3', 'write-4', 'write-5']).toContain(content)

    // No leftover .tmp files
    const entries = fs.readdirSync(tmpDir)
    expect(entries.filter((e) => e.endsWith('.tmp'))).toHaveLength(0)
  })

  it('round-trips multiline unicode content correctly', async () => {
    const destPath = path.join(tmpDir, 'unicode.txt')
    const content = '# Title\n\nHello 世界 🌍\nLine 3: αβγδ\n'

    await atomicWrite(destPath, content)

    expect(fs.readFileSync(destPath, 'utf-8')).toBe(content)
  })
})
