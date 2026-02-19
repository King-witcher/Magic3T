import { GetUserResult, ListUsersResultData } from '@magic3t/api-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { GetResult } from '@/infra/firestore/types'
import { RatingService } from '@/modules/rating'

@Injectable()
export class UserService {
  constructor(private ratingService: RatingService) {}

  async getUserByRow(row: GetResult<UserRow>): Promise<GetUserResult> {
    const rating = await this.ratingService.getRatingConverter(row.data.elo)

    return {
      id: row.id,
      role: row.data.role,
      nickname: row.data.identification.nickname,
      summonerIcon: row.data.summoner_icon,
      stats: row.data.stats,
      rating: rating.ratingData,
    }
  }

  async getListedUserByRow(row: GetResult<UserRow>): Promise<ListUsersResultData> {
    const rating = await this.ratingService.getRatingConverter(row.data.elo)

    return {
      id: row.id,
      role: row.data.role,
      nickname: row.data.identification.nickname,
      summonerIcon: row.data.summoner_icon,
      rating: rating.ratingData,
    }
  }
}
