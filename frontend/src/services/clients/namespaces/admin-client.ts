import { Admin } from '@magic3t/api-types'
import { BaseApiClient } from '../base-api-client'

export class AdminApiClient extends BaseApiClient<'admin'> {
  constructor() {
    super('admin')
  }

  /**
   * Gets a list of all user accounts, including their authentication and rating information.
   */
  listAccounts(signal?: AbortSignal): Promise<Admin.ListAccountsResult> {
    return this.get('accounts', {
      authenticated: true,
      signal,
    })
  }
}
