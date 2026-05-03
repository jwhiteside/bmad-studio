import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import { AppError } from './errors.js'

export class WriteFailedError extends AppError {
  constructor(message: string, details?: unknown) {
    super('WRITE_FAILED', message, 500, 'error', details)
    this.name = 'WriteFailedError'
  }
}

export async function atomicWrite(destPath: string, contents: string): Promise<void> {
  const tmpPath = `${destPath}.${crypto.randomBytes(6).toString('hex')}.tmp`

  try {
    await fs.promises.writeFile(tmpPath, contents, 'utf-8')
    await fs.promises.rename(tmpPath, destPath)
  } catch (err) {
    // Attempt cleanup of tmp file, ignoring any cleanup errors
    fs.promises.unlink(tmpPath).catch(() => undefined)
    throw new WriteFailedError(
      `Failed to write file: ${path.basename(destPath)}`,
      { destPath, cause: err instanceof Error ? err.message : String(err) },
    )
  }
}
