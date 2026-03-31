import { apiClient } from '@/services/clients/api-client'
import { BanType } from '@magic3t/database-types'

export interface BanUserPayload {
  type: BanType
  reason?: string
  expiresAt?: string
}

export async function banUser(userId: string, payload: BanUserPayload): Promise<void> {
  await apiClient.user.post(`${userId}/ban`, payload)
}
