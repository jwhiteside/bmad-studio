import type { ClientParamDescriptor } from './hook-templates-client.js'

type ParameterFormProps = {
  params: ClientParamDescriptor[]
  values: Record<string, string | boolean>
  onChange: (name: string, value: string | boolean) => void
  errors?: Record<string, string>
}

export function ParameterForm({ params, values, onChange, errors = {} }: ParameterFormProps) {
  return (
    <div className="space-y-3">
      {params.map((p) => {
        const id = `hook-param-${p.name}`
        const value = values[p.name]
        const errorMsg = errors[p.name]
        return (
          <div key={p.name} className="space-y-1">
            <label htmlFor={id} className="block text-xs font-medium text-zinc-700">
              {p.label}
              {p.required ? <span className="ml-1 text-red-600">*</span> : null}
            </label>
            {p.description ? (
              <p className="text-[11px] text-zinc-500">{p.description}</p>
            ) : null}
            {p.type === 'string' ? (
              <input
                id={id}
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(p.name, e.target.value)}
                className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? `${id}-err` : undefined}
              />
            ) : null}
            {p.type === 'enum' ? (
              <select
                id={id}
                value={typeof value === 'string' ? value : (p.options?.[0] ?? '')}
                onChange={(e) => onChange(p.name, e.target.value)}
                className="block w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? `${id}-err` : undefined}
              >
                {(p.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : null}
            {p.type === 'boolean' ? (
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <input
                  id={id}
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => onChange(p.name, e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? `${id}-err` : undefined}
                />
                <span>{p.label}</span>
              </label>
            ) : null}
            {errorMsg ? (
              <p id={`${id}-err`} className="text-xs text-red-600">
                {errorMsg}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
