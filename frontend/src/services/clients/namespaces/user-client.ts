import {
  ChangeIconCommand,
  ChangeNicknameCommand,
  GetUserResult,
  ListUsersResult,
  RegisterUserCommand,
} from '@magic3t/api-types'
import { BaseApiClient } from '../base-api-client'

export class ApiUserClient extends BaseApiClient<'user'> {
  constructor() {
    super('user')
  }

  async testFn(): Promise<void> {
    // empty
  }

  /**
   * Gets a user by ID.
   */
  async getById(id: string, signal?: AbortSignal): Promise<GetUserResult> {
    return this.get(`id/${id}`, { signal })
  }

  /**
   * Gets a user by nickname slug.
   */
  async getByNickname(slug: string, signal?: AbortSignal): Promise<GetUserResult> {
    return this.get<GetUserResult>(`nickname/${slug}`, { signal })
  }

  /**
   * Gets the user ranking.
   */
  async getRanking(signal?: AbortSignal): Promise<ListUsersResult> {
    return this.get<ListUsersResult>('ranking', { signal })
  }

  /**
   * Gets the authenticated user's available icons.
   */
  async getMyIcons(signal?: AbortSignal): Promise<number[]> {
    return this.get<number[]>('me/icons', { signal, authenticated: true })
  }

  /**
   * Registers an authenticated user in the database.
   *
   * This needed because authentication only provides us with a unique identifier, but we need to
   * store additional information about the user such as nickname, which is not required by the
   * authentication provider.
   */
  async register(data: RegisterUserCommand): Promise<void> {
    await this.post<RegisterUserCommand, void>('register', data, { authenticated: true })
  }

  /**
   * Updates the authenticated user's icon.
   */
  async updateIcon(icon: number): Promise<void> {
    const payload: ChangeIconCommand = { iconId: icon }
    await this.patch<ChangeIconCommand, void>('me/icon', payload, { authenticated: true })
  }

  /**
   * Updates the authenticated user's nickname.
   */
  async updateNickname(nickname: string): Promise<void> {
    const payload: ChangeNicknameCommand = { nickname }
    await this.patch<ChangeNicknameCommand, void>('me/nickname', payload, { authenticated: true })
  }
}
