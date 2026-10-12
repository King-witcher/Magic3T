import { CrashReportCommand, GetStatusResponse } from '@magic3t/api-types'
import { BaseApiClient } from './base-api-client'
import { AdminApiClient, ApiMatchClient, ApiQueueClient, ApiUserClient } from './namespaces'
import { AuthApiClient } from './namespaces/auth-client'

export class ApiClient extends BaseApiClient<undefined> {
  public readonly admin = new AdminApiClient()
  public readonly auth = new AuthApiClient()
  public readonly match = new ApiMatchClient()
  public readonly queue = new ApiQueueClient()
  public readonly user = new ApiUserClient()

  constructor() {
    super(undefined)
  }

  async getStatus(signal?: AbortSignal): Promise<GetStatusResponse> {
    return this.get<GetStatusResponse>('status', { signal })
  }

  async reportCrash(data: CrashReportCommand): Promise<void> {
    await this.post('crash-report', data)
  }
}

export const apiClient = new ApiClient()
