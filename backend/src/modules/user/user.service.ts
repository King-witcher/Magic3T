import { GetUserResult, ListUsersResultData } from '@magic3t/api-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { RatingService } from '@/modules/rating'

@Injectable()
export class UserService {
  constructor(private ratingService: RatingService) {}

  async getUserByRow(row: UserRow): Promise<GetUserResult> {
    const rating = await this.ratingService.getRatingConverter({
      challenger: row.rating_apex === 'challenger',
      k: row.rating_k_factor,
      matches: row.rating_series_played,
      score: row.rating_score,
    })

    return {
      id: row.firebase_id!,
      role: row.role,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      stats: {
        wins: row.stats_victories,
        draws: row.stats_draws,
        defeats: row.stats_defeats,
      },
      rating: rating.ratingData,
    }
  }

  async getListedUserByRow(row: UserRow): Promise<ListUsersResultData> {
    const rating = await this.ratingService.getRatingConverter({
      challenger: row.rating_apex === 'challenger',
      k: row.rating_k_factor,
      matches: row.rating_series_played,
      score: row.rating_score,
    })

    return {
      id: row.firebase_id!,
      role: row.role,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      rating: rating.ratingData,
    }
  }
}
