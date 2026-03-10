import { ForbiddenError } from '@/services/clients/client-error'

export interface BanErrorMetadata {
  type: 'permanent' | 'temporary'
  reason: string
  expiresAt?: string
}

/**
 * Checks if an error is a ban error and extracts the ban metadata.
 */
export async function extractBanInfo(error: unknown): Promise<BanErrorMetadata | null> {
  if (!(error instanceof ForbiddenError)) {
    return null
  }

  try {
    const response = error.response.clone()
    const data = await response.json()

    if (data?.errorCode === 'user-banned' && data?.metadata) {
      return data.metadata as BanErrorMetadata
    }
  } catch {
    // Failed to parse response
  }

  return null
}

/**
 * Formats the ban expiration date for display.
 */
export function formatBanExpiration(expiresAt: string): string {
  const date = new Date(expiresAt)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()

  if (diffMs <= 0) {
    return 'Expirado'
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}`
  }

  if (diffHours > 0) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
}
