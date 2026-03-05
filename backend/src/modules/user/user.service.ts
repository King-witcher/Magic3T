import { GetUserResult, ListUsersResultData } from '@magic3t/api-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@/infra'
import { RankConverter } from '@/modules/rating'

@Injectable()
export class UserService {
  constructor(private configService: ConfigService) {}

  async getUserByRow(row: UserRow): Promise<GetUserResult> {
    const ratingConfig = await this.configService.ratingConfig
    const ratingService = new RankConverter(ratingConfig)
    const rank = ratingService.getRankFromElo(
      row.rating_score,
      row.rating_ranked_count,
      row.rating_apex_flag
    )

    return {
      id: row.uuid,
      role: row.role,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      stats: {
        wins: row.stats_victories,
        draws: row.stats_draws,
        defeats: row.stats_defeats,
      },
      rank,
    }
  }

  async getListedUserByRow(row: UserRow): Promise<ListUsersResultData> {
    const ratingConfig = await this.configService.ratingConfig
    const ratingService = new RankConverter(ratingConfig)
    const rank = ratingService.getRankFromElo(
      row.rating_score,
      row.rating_ranked_count,
      row.rating_apex_flag
    )

    return {
      id: row.uuid,
      role: row.role,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      rank,
    }
  }
}
