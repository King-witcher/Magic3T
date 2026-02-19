import {
  ChangeIconCommand,
  ChangeNicknameCommand,
  CrashReportCommand,
  GetStatusResponse,
  GetUserResult,
  ListMatchesResult,
  ListUsersResult,
  RegisterUserCommand,
} from '@magic3t/api-types'
import { QueueMode } from '@/types/queue'
import { BaseApiClient } from './base-api-client'
import { AdminApiClient } from './admin-api-client'

export class UserApiClient extends BaseApiClient {
  constructor() {
    super('users')
  }

  /**
   * Gets a user by ID.
   */
  async getById(id: string): Promise<GetUserResult> {
    return this.get<GetUserResult>(`id/${id}`, false)
  }

  /**
   * Gets a user by nickname slug.
   */
  async getByNickname(slug: string): Promise<GetUserResult> {
    return this.get<GetUserResult>(`nickname/${slug}`, false)
  }

  /**
   * Gets the user ranking.
   */
  async getRanking(): Promise<ListUsersResult> {
    return this.get<ListUsersResult>('ranking', false)
  }

  /**
   * Gets the authenticated user's available icons.
   */
  async getMyIcons(): Promise<number[]> {
    return this.get<number[]>('me/icons')
  }

  /**
   * Registers an authenticated user in the database.
   *
   * This needed because authentication only provides us with a unique identifier, but we need to
   * store additional information about the user such as nickname, which is not required by the
   * authentication provider.
   */
  async register(data: RegisterUserCommand): Promise<void> {
    await this.post<RegisterUserCommand, void>('register', data)
  }

  /**
   * Updates the authenticated user's icon.
   */
  async updateIcon(icon: number): Promise<void> {
    const payload: ChangeIconCommand = { iconId: icon }
    await this.patch<ChangeIconCommand, void>('me/icon', payload)
  }

  /**
   * Updates the authenticated user's nickname.
   */
  async updateNickname(nickname: string): Promise<void> {
    const payload: ChangeNicknameCommand = { nickname }
    await this.patch<ChangeNicknameCommand, void>('me/nickname', payload)
  }
}

export class MatchApiClient extends BaseApiClient {
  constructor() {
    super('matches')
  }

  /**
   * Gets the current match for the authenticated user.
   */
  async getCurrentMatch(): Promise<{ id: string }> {
    return this.get<{ id: string }>('current')
  }

  /**
   * Checks if the authenticated user is in an active match.
   */
  async amActiveMatch(): Promise<boolean> {
    return this.get<boolean>('me/am-active')
  }

  /**
   * Gets matches by user ID.
   */
  async getMatchesByUser(userId: string, limit: number): Promise<ListMatchesResult> {
    return this.get<ListMatchesResult>(`user/${userId}?limit=${limit}`, false)
  }
}

export class QueueApiClient extends BaseApiClient {
  constructor() {
    super('queue')
  }

  /**
   * Enqueues the authenticated user in the specified queue mode.
   */
  async enqueue(queueMode: QueueMode): Promise<void> {
    await this.post('', { queueMode })
  }

  /**
   * Dequeues the authenticated user from the queue.
   */
  async dequeue(): Promise<void> {
    await this.delete('')
  }
}

export class ApiClient extends BaseApiClient {
  public readonly user = new UserApiClient()
  public readonly match = new MatchApiClient()
  public readonly queue = new QueueApiClient()
  public readonly admin = new AdminApiClient()

  /**
   * Gets the status of the API.
   */
  async getStatus(): Promise<GetStatusResponse> {
    return this.get<GetStatusResponse>('status', false)
  }

  /**
   * Reports a crash to the API.
   */
  async reportCrash(data: CrashReportCommand): Promise<void> {
    await this.post('crash-report', data, false)
  }
}

export const apiClient = new ApiClient()
