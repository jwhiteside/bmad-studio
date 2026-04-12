import { useEffect, useState, useCallback } from 'react'
import { FolderTree, File, Folder, Save, Loader2, FileText, FileCode, FileJson, Image, Table, ChevronDown, ChevronRight, FileType } from 'lucide-react'

import type { FileNode } from '@bmad-studio/shared'

import { EmptyState } from '../../shared/EmptyState.js'
import { CsvViewer } from '../../shared/CsvViewer.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'
import { useNotifications } from '../../layout/NotificationProvider.js'

function getRelativePath(filePath: string): string {
  const bmadIndex = filePath.lastIndexOf('/_bmad/')
  return bmadIndex >= 0 ? filePath.slice(bmadIndex + 7) : filePath
}

function isEditable(filePath: string): boolean {
  return /\.(md|yaml|yml)$/i.test(filePath)
}

function fileTypeIcon(name: string): typeof File {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md': return FileText
    case 'yaml': case 'yml': return FileType
    case 'json': return FileJson
    case 'ts': case 'tsx': case 'js': case 'jsx': return FileCode
    case 'png': case 'jpg': case 'jpeg': case 'svg': case 'gif': case 'webp': return Image
    case 'csv': return Table
    default: return File
  }
}

function TreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelect,
}: {
  node: FileNode
  depth?: number
  selectedPath: string | null
  onSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)

  const handleClick = () => {
    if (node.type === 'directory') {
      setExpanded(!expanded)
    } else {
      onSelect(node.path)
    }
  }

  // Highlight if either the full path or relative path matches
  const relPath = getRelativePath(node.path)
  const isSelected =
    node.type === 'file' &&
    (selectedPath === node.path || selectedPath === relPath)

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors ${
          isSelected
            ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] font-bold'
            : 'hover:bg-[var(--color-surface-raised)]'
        } cursor-pointer`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === 'directory' ? (
          <>
            {expanded ? (
              <ChevronDown size={12} className="text-[var(--color-muted)] shrink-0" />
            ) : (
              <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0" />
            )}
            <Folder size={14} className={expanded ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'} />
          </>
        ) : (
          <>
            <span className="w-3" />
            {(() => { const Icon = fileTypeIcon(node.name); return <Icon size={14} className={isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'} /> })()}
          </>
        )}
        <span className="truncate">{node.name}</span>
        {node.type === 'file' && node.size !== undefined && (
          <span className="ml-auto text-xs text-[var(--color-muted)] shrink-0">
            {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}K` : `${node.size}B`}
          </span>
        )}
      </button>
      {expanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </div>
  )
}

export function FilesPage() {
  const [tree, setTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useDetailParam('path')
  const [fileContent, setFileContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { notify } = useNotifications()

  const isDirty = fileContent !== savedContent

  useEffect(() => {
    fetch('/api/files')
      .then((r) => r.json())
      .then((d) => {
        setTree(d as FileNode[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Load content whenever selectedFile changes (handles both tree clicks and URL deep links)
  useEffect(() => {
    if (!selectedFile) {
      setFileContent('')
      setSavedContent('')
      return
    }

    setContentLoading(true)
    const relativePath = getRelativePath(selectedFile)

    fetch(`/api/files/${relativePath}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((data: { content: string; path: string }) => {
        setFileContent(data.content)
        setSavedContent(data.content)
      })
      .catch(() => {
        setFileContent('Failed to load file content.')
        setSavedContent('Failed to load file content.')
      })
      .finally(() => setContentLoading(false))
  }, [selectedFile])

  const handleSelectFile = useCallback(
    (fullPath: string) => {
      // Toggle off if same file, else navigate to new file
      const relPath = getRelativePath(fullPath)
      if (selectedFile === fullPath || selectedFile === relPath) {
        setSelectedFile(null)
      } else {
        setSelectedFile(fullPath)
      }
    },
    [selectedFile, setSelectedFile],
  )

  const handleSave = useCallback(async () => {
    if (!selectedFile || saving) return
    setSaving(true)
    const relativePath = getRelativePath(selectedFile)
    try {
      const resp = await fetch(`/api/files/${relativePath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }
      setSavedContent(fileContent)
      notify('success', `Saved ${relativePath.split('/').pop()}`)
    } catch (err) {
      notify('error', `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }, [selectedFile, fileContent, saving, notify])

  const fileName = selectedFile ? selectedFile.split('/').pop() ?? selectedFile : ''
  const editable = selectedFile ? isEditable(selectedFile) : false

  if (loading)
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Files</h1>
        <div className="h-64 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )

  if (tree.length === 0)
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Files</h1>
        <EmptyState
          icon={FolderTree}
          title="No BMAD files"
          description="No _bmad/ directory detected."
        />
      </div>
    )

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-8">Files</h1>
      <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
        <div className="py-1">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              selectedPath={selectedFile}
              onSelect={handleSelectFile}
            />
          ))}
        </div>
      </div>

      <SlideOver
        open={!!selectedFile}
        title={fileName}
        onClose={() => setSelectedFile(null)}
        width="max(480px, 50vw)"
        actions={
          editable ? (
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                isDirty && !saving
                  ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-muted)] cursor-not-allowed'
              }`}
              title={isDirty ? 'Save (⌘S)' : 'No unsaved changes'}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
            </button>
          ) : undefined
        }
      >
        {contentLoading ? (
          <div className="h-64 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        ) : selectedFile?.endsWith('.csv') ? (
          <CsvViewer content={fileContent} />
        ) : (
          <div className="rounded-lg overflow-hidden border border-[var(--color-border-subtle)]" style={{ height: 'calc(100vh - 140px)' }}>
            <MarkdownEditor
              content={fileContent}
              filePath={selectedFile ?? ''}
              onChange={setFileContent}
              onSave={handleSave}
              readOnly={!editable}
            />
          </div>
        )}
      </SlideOver>
    </div>
  )
}
