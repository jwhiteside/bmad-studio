import { useState, useCallback, useMemo, useEffect } from 'react'
import { X, GitBranch, Users, FileOutput, FileInput, FileText, FolderOpen, Layers, ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { WorkflowStep } from '@bmad-studio/shared'

import { useWorkflowDetail } from './use-workflows.js'
import { WorkflowTypeBadge } from './WorkflowsPage.js'
import { EditWorkflowDialog } from './EditWorkflowDialog.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'

type WorkflowDetailPanelProps = {
  workflowId: string
  onClose: () => void
}

function extractRelativePath(filePath: string): string {
  const bmadIndex = filePath.lastIndexOf('/_bmad/')
  return bmadIndex >= 0 ? filePath.slice(bmadIndex + 7) : filePath
}

function dirName(fullPath: string): string {
  const parts = fullPath.replace(/\/$/, '').split('/')
  return parts[parts.length - 1] ?? fullPath
}

const VARIANT_TAB_LABELS: Record<string, string> = {
  'steps-c': 'Conditional',
  'steps-e': 'Editorial',
  'steps-v': 'Validation',
}

function variantTabLabel(variantSet?: string): string {
  if (!variantSet) return 'Primary'
  return VARIANT_TAB_LABELS[variantSet] ?? variantSet
    .replace(/^steps-/, '')
    .replace(/-steps$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

type StepGroup = { key: string; label: string; steps: Array<WorkflowStep & { globalIndex: number }> }

function groupStepsByVariant(steps: WorkflowStep[]): StepGroup[] {
  const groups = new Map<string, StepGroup>()
  steps.forEach((step, globalIndex) => {
    const key = step.variantSet ?? '__primary'
    if (!groups.has(key)) {
      groups.set(key, { key, label: variantTabLabel(step.variantSet), steps: [] })
    }
    groups.get(key)!.steps.push({ ...step, globalIndex })
  })
  // Primary first, then alphabetical
  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === '__primary') return -1
    if (b.key === '__primary') return 1
    return a.key.localeCompare(b.key)
  })
}

export function WorkflowDetailPanel({ workflowId, onClose }: WorkflowDetailPanelProps) {
  const { data: workflow, isLoading } = useWorkflowDetail(workflowId)
  const [showEdit, setShowEdit] = useState(false)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [stepContent, setStepContent] = useState<string | null>(null)
  const [stepLoading, setStepLoading] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [templateContent, setTemplateContent] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [activeVariantTab, setActiveVariantTab] = useState<string>('__primary')
  const [supportingFileGroups, setSupportingFileGroups] = useState<Array<{ name: string; files: Array<{ name: string; relativePath: string }> }>>([])
  const [expandedSupportingFile, setExpandedSupportingFile] = useState<string | null>(null)
  const [supportingFileContent, setSupportingFileContent] = useState<string | null>(null)
  const [supportingFileLoading, setSupportingFileLoading] = useState(false)

  useEffect(() => {
    if (!workflow || workflow.type !== 'agent-based') {
      setSupportingFileGroups([])
      return
    }
    fetch(`/api/workflows/${workflowId}/supporting-files`)
      .then((r) => r.json())
      .then((data: { groups: typeof supportingFileGroups }) => setSupportingFileGroups(data.groups))
      .catch(() => setSupportingFileGroups([]))
  }, [workflow, workflowId])

  const handleSupportingFileClick = useCallback(
    async (relativePath: string) => {
      if (expandedSupportingFile === relativePath) {
        setExpandedSupportingFile(null)
        setSupportingFileContent(null)
        return
      }
      setExpandedSupportingFile(relativePath)
      if (relativePath.endsWith('.md')) {
        setSupportingFileLoading(true)
        try {
          const resp = await fetch(`/api/files/${relativePath}`)
          if (resp.ok) {
            const data = (await resp.json()) as { content: string }
            setSupportingFileContent(data.content)
          } else {
            setSupportingFileContent('Could not load file.')
          }
        } catch {
          setSupportingFileContent('Failed to load file.')
        } finally {
          setSupportingFileLoading(false)
        }
      }
    },
    [expandedSupportingFile],
  )

  const stepGroups = useMemo(() => {
    if (!workflow) return []
    return groupStepsByVariant(workflow.steps)
  }, [workflow])

  const activeGroup = useMemo(() => {
    return stepGroups.find((g) => g.key === activeVariantTab) ?? stepGroups[0]
  }, [stepGroups, activeVariantTab])

  const handleStepClick = useCallback(
    async (globalIndex: number) => {
      if (expandedStep === globalIndex) {
        setExpandedStep(null)
        setStepContent(null)
        return
      }
      setExpandedStep(globalIndex)
      setStepLoading(true)
      try {
        const resp = await fetch(`/api/workflows/${workflowId}/steps/${globalIndex}`)
        if (resp.ok) {
          const data = (await resp.json()) as { content: string }
          setStepContent(data.content)
        } else {
          setStepContent('Could not load step instructions.')
        }
      } catch {
        setStepContent('Failed to load step instructions.')
      } finally {
        setStepLoading(false)
      }
    },
    [expandedStep, workflowId],
  )

  const handleTemplateClick = useCallback(
    async (filePath: string) => {
      if (expandedTemplate === filePath) {
        setExpandedTemplate(null)
        setTemplateContent(null)
        return
      }
      setExpandedTemplate(filePath)
      setTemplateLoading(true)
      try {
        const relativePath = extractRelativePath(filePath)
        const resp = await fetch(`/api/files/${relativePath}`)
        if (resp.ok) {
          const data = (await resp.json()) as { content: string }
          setTemplateContent(data.content)
        } else {
          setTemplateContent('Could not load template.')
        }
      } catch {
        setTemplateContent('Failed to load template.')
      } finally {
        setTemplateLoading(false)
      }
    },
    [expandedTemplate],
  )

  return (
    <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="slide-over-bg" onClick={onClose} />
      <aside className="slide-over-panel" style={{ width: 'max(400px, 40vw)' }}>
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-bold truncate">{workflow?.name ?? 'Loading...'}</h2>
          {workflow && <WorkflowTypeBadge type={workflow.type} />}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {workflow && (
            <button
              onClick={() => setShowEdit(true)}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
              title="Edit Workflow"
            >
              <Pencil size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-6 space-y-3">
          <div className="h-4 w-3/4 rounded bg-[var(--color-surface-raised)] animate-pulse" />
          <div className="h-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        </div>
      )}

      {workflow && (
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
          <div>
            <p className="text-sm text-[var(--color-muted)]">{workflow.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {workflow.module && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                {workflow.module}
              </span>
            )}
            {workflow.phase && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                {workflow.phase}
              </span>
            )}
          </div>

          {/* Steps with variant tabs */}
          {workflow.steps.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Steps ({workflow.steps.length})</h3>

              {/* Variant tabs — only show if multiple groups */}
              {stepGroups.length > 1 && (
                <div className="flex gap-1 mb-3 flex-wrap bg-[var(--color-surface-raised)] rounded-md p-1">
                  {stepGroups.map((group) => (
                    <button
                      key={group.key}
                      onClick={() => setActiveVariantTab(group.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                        activeVariantTab === group.key
                          ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {group.label}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold">
                        {group.steps.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-[var(--color-muted)] mb-3">Click a step to view its instructions</p>
              <div className="space-y-1.5">
                {activeGroup?.steps.map((step, localIndex) => {
                  const stepNum = String(localIndex + 1).padStart(2, '0')
                  const truncatedDesc = step.description
                    ? step.description.split('\n')[0].slice(0, 80) + (step.description.length > 80 ? '…' : '')
                    : null
                  return (
                  <div key={step.globalIndex} className={step.isVariant ? 'ml-6 pl-4 border-l-2 border-[var(--color-border-subtle)]' : ''}>
                    <button
                      onClick={() => step.filePath && handleStepClick(step.globalIndex)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        expandedStep === step.globalIndex
                          ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                          : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                      } ${step.filePath ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        {step.filePath ? (
                          expandedStep === step.globalIndex ? <ChevronDown size={12} className="text-[var(--color-accent)] shrink-0" /> : <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0" />
                        ) : null}
                        {step.isVariant ? (
                          <span className="text-xs text-[var(--color-muted)] shrink-0">↳</span>
                        ) : (
                          <span className="text-xs font-bold text-[var(--color-accent)] font-[var(--font-mono)] w-5 shrink-0 text-right">
                            {stepNum}
                          </span>
                        )}
                        <span className={`text-sm font-bold truncate ${step.isVariant ? 'text-[var(--color-muted)]' : ''}`}>{step.title}</span>
                        {step.agent && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-accent)] font-bold shrink-0">
                            <Users size={9} />
                            {step.agent}
                          </span>
                        )}
                      </div>
                      {truncatedDesc && (
                        <p className={`text-xs mt-1 ml-[calc(12px+0.625rem+1.25rem)] truncate ${step.isVariant ? 'text-[var(--color-muted)]/60' : 'text-[var(--color-muted)]'}`}>{truncatedDesc}</p>
                      )}
                      {(step.inputs?.length || step.outputs?.length) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 ml-[calc(12px+0.625rem+1.25rem)]">
                          {step.inputs?.map((input) => (
                            <span
                              key={input}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]"
                            >
                              <FileInput size={9} />
                              {input}
                            </span>
                          ))}
                          {step.outputs?.map((output) => (
                            <span
                              key={output}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-success)]"
                            >
                              <FileOutput size={9} />
                              {output}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>

                    {expandedStep === step.globalIndex && (
                      <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-64">
                        {stepLoading ? (
                          <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
                        ) : (
                          <MarkdownEditor
                            content={stepContent ?? ''}
                            filePath={step.filePath}
                            onChange={() => {}}
                            readOnly
                          />
                        )}
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Templates */}
          {workflow.templates && workflow.templates.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Templates ({workflow.templates.length})</h3>
              <div className="space-y-2">
                {workflow.templates.map((tpl) => (
                  <div key={tpl.filePath}>
                    <button
                      onClick={() => handleTemplateClick(tpl.filePath)}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer text-left ${
                        expandedTemplate === tpl.filePath
                          ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                          : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                      }`}
                    >
                      {expandedTemplate === tpl.filePath
                        ? <ChevronDown size={12} className="text-[var(--color-accent)]" />
                        : <ChevronRight size={12} className="text-[var(--color-muted)]" />}
                      <FileText size={14} className="text-[var(--color-muted)]" />
                      <span className="text-sm">{tpl.name}.template.md</span>
                    </button>
                    {expandedTemplate === tpl.filePath && (
                      <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-48">
                        {templateLoading ? (
                          <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
                        ) : (
                          <MarkdownEditor
                            content={templateContent ?? ''}
                            filePath={tpl.filePath}
                            onChange={() => {}}
                            readOnly
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Workflows */}
          {workflow.subWorkflows && workflow.subWorkflows.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Sub-Workflows ({workflow.subWorkflows.length})</h3>
              <div className="space-y-1">
                {workflow.subWorkflows.map((sw) => (
                  <div
                    key={sw.filePath}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                  >
                    <Layers size={14} className="text-[var(--color-muted)]" />
                    <span className="text-sm">{sw.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent-based: Agents & Resources with clickable files */}
          {workflow.type === 'agent-based' && supportingFileGroups.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Agents & Resources</h3>
              <div className="space-y-4">
                {supportingFileGroups.map((group) => (
                  <div key={group.name}>
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen size={12} className="text-[var(--color-muted)]" />
                      <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                        {group.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold">
                        {group.files.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {group.files.map((file) => (
                        <div key={file.relativePath}>
                          {file.name.endsWith('.md') ? (
                            <button
                              onClick={() => handleSupportingFileClick(file.relativePath)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer text-left ${
                                expandedSupportingFile === file.relativePath
                                  ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                                  : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                              }`}
                            >
                              {expandedSupportingFile === file.relativePath
                                ? <ChevronDown size={12} className="text-[var(--color-accent)]" />
                                : <ChevronRight size={12} className="text-[var(--color-muted)]" />}
                              <FileText size={14} className="text-[var(--color-muted)]" />
                              <span className="text-sm">{file.name}</span>
                            </button>
                          ) : (
                            <Link
                              to={`/files?path=${encodeURIComponent(file.relativePath)}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors"
                            >
                              <FileText size={14} className="text-[var(--color-muted)]" />
                              <span className="text-sm text-[var(--color-accent)] hover:underline">{file.name}</span>
                            </Link>
                          )}
                          {expandedSupportingFile === file.relativePath && file.name.endsWith('.md') && (
                            <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-48">
                              {supportingFileLoading ? (
                                <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
                              ) : (
                                <MarkdownEditor
                                  content={supportingFileContent ?? ''}
                                  filePath={file.relativePath}
                                  onChange={() => {}}
                                  readOnly
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Files (non-agent-based fallback) */}
          {workflow.type !== 'agent-based' && workflow.supportingFiles && workflow.supportingFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Supporting Files</h3>
              <div className="space-y-1">
                {workflow.supportingFiles.map((dir) => (
                  <div
                    key={dir}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                  >
                    <FolderOpen size={14} className="text-[var(--color-muted)]" />
                    <span className="text-sm">{dirName(dir)}/</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <GitBranch size={12} />
            <span className="font-[var(--font-mono)]">{workflow.filePath}</span>
          </div>
        </div>
      )}
    </aside>

      {showEdit && workflow && (
        <EditWorkflowDialog
          workflow={workflow}
          onClose={() => setShowEdit(false)}
          onSaved={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
