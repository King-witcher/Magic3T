import { BanUserCommand, BanUserResponse, ListBansResult, UnbanUserCommand } from '@magic3t/api-types'
import { BaseApiClient } from './base-api-client'

export class AdminApiClient extends BaseApiClient {
  constructor() {
    super('admin')
  }

  /**
   * Ban a user (temporary or permanent)
   */
  async banUser(command: BanUserCommand): Promise<BanUserResponse> {
    return this.post<BanUserCommand, BanUserResponse>('bans', command)
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<void> {
    await this.delete(`bans/${userId}`)
  }

  /**
   * Get all active bans
   */
  async listActiveBans(): Promise<ListBansResult> {
    return this.get<ListBansResult>('bans')
  }
}
