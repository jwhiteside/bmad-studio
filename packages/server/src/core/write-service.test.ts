import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { deleteDirectory, deleteFile, getHistory, writeFile } from './write-service.js'

describe('write-service', () => {
  let tmpDir: string
  let studioDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'write-test-')))
    studioDir = path.join(tmpDir, '.bmad-studio')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes a new file atomically', () => {
    const filePath = path.join(tmpDir, 'test.md')
    const result = writeFile(filePath, 'hello world', studioDir)

    expect(result.ok).toBe(true)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world')
  })

  it('creates snapshot before overwriting existing file', () => {
    const filePath = path.join(tmpDir, 'test.md')
    fs.writeFileSync(filePath, 'original content')

    const result = writeFile(filePath, 'new content', studioDir)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.snapshotPath).not.toBeNull()
      expect(fs.readFileSync(result.snapshotPath!, 'utf-8')).toBe('original content')
    }
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('new content')
  })

  it('does not create snapshot for new files', () => {
    const filePath = path.join(tmpDir, 'brand-new.md')
    const result = writeFile(filePath, 'content', studioDir)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.snapshotPath).toBeNull()
    }
  })

  it('prunes history when exceeding HISTORY_CAP (500 after TD-17)', () => {
    const historyDir = path.join(studioDir, 'history')
    fs.mkdirSync(historyDir, { recursive: true })

    // Create 502 existing snapshots
    for (let i = 0; i < 502; i++) {
      fs.writeFileSync(path.join(historyDir, `${1000 + i}-old.md`), `snapshot ${i}`)
    }

    const filePath = path.join(tmpDir, 'test.md')
    fs.writeFileSync(filePath, 'existing')
    writeFile(filePath, 'updated', studioDir)

    const remaining = fs.readdirSync(historyDir)
    expect(remaining.length).toBeLessThanOrEqual(500)
  })

  it('getHistory returns sorted list of snapshots', () => {
    const historyDir = path.join(studioDir, 'history')
    fs.mkdirSync(historyDir, { recursive: true })
    fs.writeFileSync(path.join(historyDir, '1000-a.md'), 'a')
    fs.writeFileSync(path.join(historyDir, '2000-b.md'), 'b')

    const history = getHistory(studioDir)
    expect(history).toEqual(['2000-b.md', '1000-a.md'])
  })

  it('returns error on write to invalid path', () => {
    const filePath = path.join(tmpDir, 'nonexistent', 'deep', 'nested', 'file.md')
    const result = writeFile(filePath, 'content', studioDir)

    expect(result.ok).toBe(true) // ensureDir creates parents
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('content')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Story 15.7 — deleteFile / deleteDirectory
  // ───────────────────────────────────────────────────────────────────────────

  describe('deleteFile', () => {
    it('AC-15.7.1: snapshots a text file to history/ then unlinks', () => {
      const filePath = path.join(tmpDir, 'doc.md')
      fs.writeFileSync(filePath, '# Original content\n')

      const result = deleteFile(filePath, studioDir)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // File is gone
      expect(fs.existsSync(filePath)).toBe(false)

      // Snapshot exists in history/
      expect(result.snapshotPath).not.toBeNull()
      expect(result.snapshotPath).toBeTruthy()
      const historyEntries = fs.readdirSync(path.join(studioDir, 'history'))
      const snap = historyEntries.find((n) => n.endsWith('doc.md'))
      expect(snap).toBeDefined()
      expect(fs.readFileSync(path.join(studioDir, 'history', snap!), 'utf-8')).toBe(
        '# Original content\n',
      )
    })

    it('TD-16: binary file unlinks without snapshot', () => {
      const filePath = path.join(tmpDir, 'logo.png')
      // PNG header bytes (intentionally invalid utf-8 so any accidental decode breaks)
      fs.writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))

      const result = deleteFile(filePath, studioDir)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // File is gone
      expect(fs.existsSync(filePath)).toBe(false)

      // snapshotPath is null (no snapshot for binaries)
      expect(result.snapshotPath).toBeNull()

      // No .png files in history/ at all
      const historyDir = path.join(studioDir, 'history')
      if (fs.existsSync(historyDir)) {
        const entries = fs.readdirSync(historyDir)
        expect(entries.some((n) => n.endsWith('.png'))).toBe(false)
      }
    })

    it('AC-15.7.3: returns { ok: false } on missing path (does not throw)', () => {
      const result = deleteFile(path.join(tmpDir, 'ghost.md'), studioDir)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('File does not exist')
    })
  })

  describe('deleteDirectory', () => {
    it('AC-15.7.2: snapshots text files before unlinking the tree', () => {
      const dir = path.join(tmpDir, 'mod')
      fs.mkdirSync(path.join(dir, 'agents'), { recursive: true })
      fs.writeFileSync(path.join(dir, 'agents', 'a.md'), '# Agent A\n')
      fs.writeFileSync(path.join(dir, 'agents', 'b.md'), '# Agent B\n')
      fs.writeFileSync(path.join(dir, 'config.yaml'), 'key: value\n')

      const result = deleteDirectory(dir, studioDir)
      expect(result.ok).toBe(true)

      // The directory is gone
      expect(fs.existsSync(dir)).toBe(false)

      // All three text files snapshotted
      const history = fs.readdirSync(path.join(studioDir, 'history'))
      expect(history.some((n) => n.endsWith('a.md'))).toBe(true)
      expect(history.some((n) => n.endsWith('b.md'))).toBe(true)
      expect(history.some((n) => n.endsWith('config.yaml'))).toBe(true)
    })

    it('TD-16: mixed text + binary dir snapshots only text', () => {
      const dir = path.join(tmpDir, 'mod')
      fs.mkdirSync(path.join(dir, 'assets'), { recursive: true })
      fs.writeFileSync(path.join(dir, 'readme.md'), '# Readme\n')
      fs.writeFileSync(
        path.join(dir, 'assets', 'icon.png'),
        Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      )

      const result = deleteDirectory(dir, studioDir)
      expect(result.ok).toBe(true)

      // Directory is gone
      expect(fs.existsSync(dir)).toBe(false)

      // readme.md snapshotted, icon.png NOT
      const history = fs.readdirSync(path.join(studioDir, 'history'))
      expect(history.some((n) => n.endsWith('readme.md'))).toBe(true)
      expect(history.some((n) => n.endsWith('.png'))).toBe(false)
    })

    it('AC-15.7.3: returns { ok: false } on missing directory', () => {
      const result = deleteDirectory(path.join(tmpDir, 'ghost-dir'), studioDir)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('Directory does not exist')
    })
  })
})
