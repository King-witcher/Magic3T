import { Admin } from '@magic3t/api-types'
import { BaseApiClient } from '../base-api-client'

export class AdminApiClient extends BaseApiClient<'admin'> {
  constructor() {
    super('admin')
  }

  /**
   * Lists platform users with optional free-text search (nickname or UUID), sorting and pagination.
   */
  listUsers(query: Admin.ListUsersQuery, signal?: AbortSignal): Promise<Admin.ListUsersResult> {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.sort) params.set('sort', query.sort)
    if (query.order) params.set('order', query.order)
    if (query.cursor) params.set('cursor', query.cursor)
    if (query.limit !== undefined) params.set('limit', String(query.limit))

    const queryString = params.toString()
    return this.get<Admin.ListUsersResult>(`users${queryString ? `?${queryString}` : ''}`, {
      signal,
    })
  }

  /**
   * Gets the full information of a single user for the admin detail/edit screen.
   */
  getUser(id: string, signal?: AbortSignal): Promise<Admin.AdminUserDetail> {
    return this.get<Admin.AdminUserDetail>(`users/${id}`, { signal })
  }

  /**
   * Lists the full game icon catalogue, ordered by release date.
   */
  listIcons(signal?: AbortSignal): Promise<Admin.ListIconsResult> {
    return this.get<Admin.ListIconsResult>('icons', { signal })
  }

  /**
   * Updates a user from the admin panel. Only the provided fields are changed.
   */
  updateUser(args: {
    id: string
    command: Admin.UpdateUserCommand
  }): Promise<Admin.AdminUserDetail> {
    return this.patch<Admin.UpdateUserCommand, Admin.AdminUserDetail>(
      `users/${args.id}`,
      args.command
    )
  }
}
