export type Severity = 'error' | 'warning'

export type ErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'FILE_SYSTEM_ERROR'
  | 'INTERNAL_ERROR'
  | 'MANIFEST_MISSING'
  | 'MANIFEST_PARSE_ERROR'

export type ApiError = {
  error: {
    code: ErrorCode
    message: string
    details?: unknown
    severity: Severity
  }
}
