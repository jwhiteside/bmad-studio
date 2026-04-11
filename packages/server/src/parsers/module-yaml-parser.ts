import fs from 'node:fs'
import path from 'node:path'

import yaml from 'js-yaml'

import type { ModuleYaml } from '@bmad-studio/shared'

import type { ParseResult } from './config-parser.js'

/**
 * Parse a module's `module.yaml` metadata file.
 *
 * Takes a directory path (not a file path) because `module.yaml` is OPTIONAL.
 * Legacy v6 modules like `dept-aem` ship without one — for these, the parser
 * returns a graceful fallback derived from the directory basename. See TD-14
 * in tech-spec-bmad-studio-module-manager-v1.md for the rationale.
 *
 * Returns:
 *   - `{ ok: true, data }` when the file is absent (fallback) OR present and valid.
 *   - `{ ok: false, error }` only when the file exists but is empty / not an object / malformed YAML.
 */
export function parseModuleYaml(moduleDir: string): ParseResult<ModuleYaml> {
  const yamlPath = path.join(moduleDir, 'module.yaml')
  const fallbackCode = path.basename(moduleDir)

  // Graceful fallback for the common case where module.yaml is absent.
  if (!fs.existsSync(yamlPath)) {
    return {
      ok: true,
      data: {
        code: fallbackCode,
        version: '1.0.0',
        variables: {},
        directories: [],
      },
    }
  }

  try {
    const content = fs.readFileSync(yamlPath, 'utf-8')
    const data = yaml.load(content) as Partial<ModuleYaml> | null

    if (!data || typeof data !== 'object') {
      return {
        ok: false,
        error: 'module.yaml is empty or not an object',
        filePath: yamlPath,
      }
    }

    return {
      ok: true,
      data: {
        code: (data.code ?? fallbackCode).toString(),
        name: data.name,
        version: data.version ?? '1.0.0',
        description: data.description,
        variables: data.variables ?? {},
        directories: data.directories ?? [],
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      error: `module.yaml parse error: ${message}`,
      filePath: yamlPath,
    }
  }
}
