import fs from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'
import yaml from 'js-yaml'

import type { Skill } from '@bmad-studio/shared'

import type { ParseResult } from './config-parser.js'

type SkillManifest = {
  skill?: {
    canonicalId?: string
    name?: string
    description?: string
  }
  topics?: string[]
}

function readSiblingManifest(skillFilePath: string): SkillManifest | null {
  const dir = path.dirname(skillFilePath)
  const manifestPath = path.join(dir, 'bmad-skill-manifest.yaml')
  if (!fs.existsSync(manifestPath)) return null
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    return yaml.load(content) as SkillManifest
  } catch {
    return null
  }
}

export function parseSkill(filePath: string, content: string): ParseResult<Skill> {
  try {
    const { data: frontmatter, content: body } = matter(content)

    let id = (frontmatter.name as string) || ''
    let name = (frontmatter.name as string) || ''
    let description = (frontmatter.description as string) || ''
    let bestFor = frontmatter.best_for as string[] | undefined

    // Fall back to sibling manifest when frontmatter is missing or has no name
    if (!name) {
      const manifest = readSiblingManifest(filePath)
      if (manifest?.skill) {
        id = manifest.skill.canonicalId || manifest.skill.name || ''
        name = manifest.skill.name || ''
        description = manifest.skill.description || ''
      }
      if (!bestFor && manifest?.topics) {
        bestFor = manifest.topics
      }
      // Last resort: derive name from directory
      if (!name) {
        name = path.basename(path.dirname(filePath))
        id = id || name
      }
    }

    const skill: Skill = {
      id,
      name,
      description,
      bestFor,
      content: body.trim(),
      filePath,
      module: undefined,
    }

    return { ok: true, data: skill }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Skill parse error: ${message}`, filePath }
  }
}
