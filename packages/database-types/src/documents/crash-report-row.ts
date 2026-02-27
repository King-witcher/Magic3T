// To be improved
export type CrashReportRow = {
  source: 'client' | 'server'
  date: Date
  error: object
  metadata: object | null
}
