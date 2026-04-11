import { useEffect, useState, useCallback } from 'react'
import { FolderTree, File, Folder } from 'lucide-react'

import type { FileNode } from '@bmad-studio/shared'

import { EmptyState } from '../../shared/EmptyState.js'
import { CsvViewer } from '../../shared/CsvViewer.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'

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

  const isSelected = node.type === 'file' && selectedPath === node.path

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
          isSelected
            ? 'bg-[var(--color-surface-raised)] text-[var(--color-accent)] font-bold'
            : 'hover:bg-[var(--color-surface-raised)]'
        } ${node.type === 'directory' || node.type === 'file' ? 'cursor-pointer' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.type === 'directory' ? (
          <Folder size={14} className={expanded ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'} />
        ) : (
          <File size={14} className={isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'} />
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
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    fetch('/api/files')
      .then((r) => r.json())
      .then((d) => {
        setTree(d as FileNode[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelectFile = useCallback(
    async (fullPath: string) => {
      if (selectedFile === fullPath) {
        setSelectedFile(null)
        return
      }
      setSelectedFile(fullPath)
      setContentLoading(true)

      // Extract relative path from full path (strip everything up to and including _bmad/)
      // Use lastIndexOf so project roots that contain "_bmad/" in their own name don't cause mismatch.
      const bmadIndex = fullPath.lastIndexOf('/_bmad/')
      const relativePath = bmadIndex >= 0 ? fullPath.slice(bmadIndex + 7) : fullPath

      try {
        const resp = await fetch(`/api/files/${relativePath}`)
        if (resp.ok) {
          const data = (await resp.json()) as { content: string; path: string }
          setFileContent(data.content)
        } else {
          setFileContent('Failed to load file.')
        }
      } catch {
        setFileContent('Failed to load file content.')
      } finally {
        setContentLoading(false)
      }
    },
    [selectedFile],
  )

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
        title={selectedFile ?? ''}
        onClose={() => setSelectedFile(null)}
      >
        {contentLoading ? (
          <div className="h-64 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        ) : selectedFile?.endsWith('.csv') ? (
          <CsvViewer content={fileContent} />
        ) : (
          <div className="h-96 rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
            <MarkdownEditor
              content={fileContent}
              filePath={selectedFile ?? ''}
              onChange={() => {}}
              readOnly
            />
          </div>
        )}
      </SlideOver>
    </div>
  )
}
