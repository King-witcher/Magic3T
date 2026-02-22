import { Match } from '@magic3t/api-types'
import { BaseApiClient } from '../base-api-client'

export class ApiMatchClient extends BaseApiClient<'match'> {
  constructor() {
    super('match')
  }

  /**
   * Gets a match by its ID.
   */
  async getById(matchId: string, signal?: AbortSignal): Promise<Match.FindMatchResult> {
    return this.get<Match.FindMatchResult>(matchId, { signal })
  }

  /**
   * Gets the current match for the authenticated user.
   */
  async getCurrentMatch(signal?: AbortSignal): Promise<{ id: string }> {
    return this.get<{ id: string }>('current', { authenticated: true, signal })
  }

  /**
   * Checks if the authenticated user is in an active match.
   */
  async amActiveMatch(signal?: AbortSignal): Promise<boolean> {
    return this.get<boolean>('me/am-active', { authenticated: true, signal })
  }

  /**
   * Gets matches by user ID.
   */
  async listUserMatches(
    args: { limit: number; userId: string },
    signal?: AbortSignal
  ): Promise<Match.ListMatchesResult> {
    const { limit, userId } = args
    return this.get<Match.ListMatchesResult>(`user/${userId}?limit=${limit}`, { signal })
  }
}
