import { CrashReportCommand, GetStatusResponse } from '@magic3t/api-types'
import { BaseApiClient } from './base-api-client'
import { AdminApiClient, ApiMatchClient, ApiQueueClient, ApiUserClient } from './namespaces'

export class ApiClient extends BaseApiClient<undefined> {
  public readonly user = new ApiUserClient()
  public readonly match = new ApiMatchClient()
  public readonly queue = new ApiQueueClient()
  public readonly admin = new AdminApiClient()

  constructor() {
    super(undefined)
  }

  /**
   * Gets the status of the API.
   */
  async getStatus(signal?: AbortSignal): Promise<GetStatusResponse> {
    return this.get<GetStatusResponse>('status', { authenticated: false, signal })
  }

  /**
   * Reports a crash to the API.
   */
  async reportCrash(data: CrashReportCommand): Promise<void> {
    await this.post('crash-report', data, { authenticated: false })
  }
}

export const apiClient = new ApiClient()
