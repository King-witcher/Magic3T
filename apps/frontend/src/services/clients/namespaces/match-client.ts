import { Match } from '@magic3t/api-types'
import { BaseApiClient } from '../base-api-client'

export class ApiMatchClient extends BaseApiClient<'match'> {
  constructor() {
    super('match')
  }

  async getById(matchId: string, signal?: AbortSignal): Promise<Match.GetMatchResult> {
    return this.get<Match.GetMatchResult>(matchId, { signal })
  }

  async getCurrentMatch(signal?: AbortSignal): Promise<{ id: string }> {
    return this.get<{ id: string }>('current', { signal })
  }

  /**
   * Checks if the authenticated user is in an active match.
   */
  async amActiveMatch(signal?: AbortSignal): Promise<boolean> {
    return this.get<boolean>('me/am-active', { signal })
  }

  async listUserMatches(
    args: { limit: number; userId: string },
    signal?: AbortSignal
  ): Promise<Match.ListMatchesResult> {
    const { limit, userId } = args
    return this.get<Match.ListMatchesResult>(`user/${userId}?limit=${limit}`, { signal })
  }
}
