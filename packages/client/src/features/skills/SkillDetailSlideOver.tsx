import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'

import { useSkillDetail } from './use-skills.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { FilepathLink } from '../../shared/FilepathLink.js'

type SkillDetailSlideOverProps = {
  skillId: string
  onClose: () => void
}

function extractFileReferences(content: string): string[] {
  const refs: string[] = []
  // Match patterns like ./workflow.md, ./somefile.yaml, etc.
  const regex = /(?:in|from|see|follow)\s+(?:the\s+(?:instructions\s+in\s+)?)?[`"']?(\.\/[\w./-]+)[`"']?/gi
  let match
  while ((match = regex.exec(content)) !== null) {
    refs.push(match[1])
  }
  // Also match bare ./file.ext patterns
  const bareRegex = /\.\/([\w-]+\.(?:md|yaml|yml|txt))/g
  while ((match = bareRegex.exec(content)) !== null) {
    const ref = `./${match[1]}`
    if (!refs.includes(ref)) refs.push(ref)
  }
  // Clean: strip trailing periods, deduplicate
  const cleaned = refs.map((r) => r.replace(/\.+$/, ''))
  return [...new Set(cleaned)]
}

function ReferencedFile({
  reference,
  skillFilePath,
}: {
  reference: string
  skillFilePath: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (content !== null) return

    setLoading(true)
    try {
      // Resolve relative to skill file's directory
      const skillDir = skillFilePath.substring(0, skillFilePath.lastIndexOf('/'))
      const bmadIndex = skillDir.lastIndexOf('/_bmad/')
      const relDir = bmadIndex >= 0 ? skillDir.slice(bmadIndex + 7) : skillDir
      const refFile = reference.replace('./', '')
      const fullPath = relDir ? `${relDir}/${refFile}` : refFile

      const resp = await fetch(`/api/files/${fullPath}`)
      if (resp.ok) {
        const data = (await resp.json()) as { content: string }
        setContent(data.content)
      } else {
        setContent('Could not load file.')
      }
    } catch {
      setContent('Failed to load file.')
    } finally {
      setLoading(false)
    }
  }, [expanded, content, skillFilePath, reference])

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-surface-raised)] transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-[var(--color-muted)]" />
        ) : (
          <ChevronRight size={14} className="text-[var(--color-muted)]" />
        )}
        <FileText size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-[var(--font-mono)]">{reference}</span>
      </button>
      {expanded && (
        <div className="border-t border-[var(--color-border-subtle)] h-48">
          {loading ? (
            <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
          ) : (
            <MarkdownEditor
              content={content ?? ''}
              filePath={reference}
              onChange={() => {}}
              readOnly
            />
          )}
        </div>
      )}
    </div>
  )
}

export function SkillDetailSlideOver({ skillId, onClose }: SkillDetailSlideOverProps) {
  const { data: skill, isLoading } = useSkillDetail(skillId)

  const skillContent = skill?.content ?? ''
  const fileReferences = useMemo(() => {
    if (!skillContent) return []
    return extractFileReferences(skillContent)
  }, [skillContent])

  return (
    <SlideOver open title={skill?.name ?? 'Loading...'} onClose={onClose}>
      {isLoading && (
        <div className="space-y-3">
          <div className="h-4 w-3/4 rounded bg-[var(--color-surface-raised)] animate-pulse" />
          <div className="h-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        </div>
      )}

      {skill && (
        <>
          <div>
            <p className="text-sm text-[var(--color-muted)]">{skill.description}</p>
          </div>

          {skill.bestFor && skill.bestFor.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2">Best for</h3>
              <div className="flex flex-wrap gap-1">
                {skill.bestFor.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold mb-2">Content</h3>
            <div className="h-64 rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
              <MarkdownEditor
                content={skill.content}
                filePath={skill.filePath}
                onChange={() => {}}
                readOnly
              />
            </div>
          </div>

          {fileReferences.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2">Referenced Files</h3>
              <div className="space-y-2">
                {fileReferences.map((ref) => (
                  <ReferencedFile
                    key={ref}
                    reference={ref}
                    skillFilePath={skill.filePath}
                  />
                ))}
              </div>
            </div>
          )}

          <FilepathLink path={skill.filePath} showIcon />
        </>
      )}
    </SlideOver>
  )
}
