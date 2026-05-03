import { AlertCircle } from 'lucide-react'

import { useCustomize } from '../../hooks/use-customize.js'
import { Skeleton } from '../../shared/Skeleton.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { LayerPane } from './LayerPane.js'
import { MergedPane } from './MergedPane.js'

type CustomizeEditorProps = {
  skillId: string
}

export function CustomizeEditor({ skillId }: CustomizeEditorProps) {
  const result = useCustomize(skillId)

  if (result.status === 'loading') {
    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="xl:grid xl:grid-cols-4 xl:gap-3 xl:h-full flex flex-col gap-3">
          <Skeleton className="h-64 xl:h-full" />
          <Skeleton className="h-64 xl:h-full" />
          <Skeleton className="h-64 xl:h-full" />
          <Skeleton className="h-64 xl:h-full" />
        </div>
      </div>
    )
  }

  if (result.status === 'error') {
    return (
      <div className="flex flex-col h-full">
        <EmptyState
          icon={AlertCircle}
          title="Could not load customization"
          description={result.message}
          actions={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Retry
            </button>
          }
        />
      </div>
    )
  }

  if (result.status === 'not-customizable') {
    return (
      <div className="flex flex-col h-full items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground max-w-md">
          This skill has no <code className="font-mono text-xs px-1 py-0.5 rounded bg-muted">customize.toml</code> — it is not customizable.
        </p>
      </div>
    )
  }

  // status === 'ok'
  const { data } = result

  return (
    <div className="flex flex-col h-full">
      <div className="xl:grid xl:grid-cols-4 xl:gap-3 xl:h-full flex flex-col gap-3">
        <div className="h-64 xl:h-full">
          <LayerPane label="Base" content={data.base} />
        </div>
        <div className="h-64 xl:h-full">
          <LayerPane label="Team" content={data.team} placeholder="No team override yet" />
        </div>
        <div className="h-64 xl:h-full">
          <LayerPane label="User" content={data.user} placeholder="No user override yet" />
        </div>
        <div className="h-64 xl:h-full">
          <MergedPane merged={data.merged} provenance={data.provenance} />
        </div>
      </div>
    </div>
  )
}
