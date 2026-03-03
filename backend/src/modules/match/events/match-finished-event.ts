import { MatchRowEvent, RatingConfigRow, UserApexFlag, UserRow } from '@magic3t/database-types'
import { RatingService } from '@/modules/rating'

type FinishedMatchContextPlayer = {
  row: UserRow
  matchScore: number
  newRating: {
    score: number
    kFactor: number
    apexFlag: UserApexFlag
  }
  prevLp: number | null
  newLp: number | null
  timeSpent: number
}

export type FinishedMatchContext = {
  order: FinishedMatchContextPlayer
  chaos: FinishedMatchContextPlayer

  configSnapshot: RatingConfigRow
  ratingService: RatingService

  startedAt: Date
  ranked: boolean
  events: MatchRowEvent[]
}

// Atualizar elo e fator k do jogador
// Salvar partida com elo, lp total e ganho de lp
// Avisar jogadores do resultado da partida, incluindo ganho de lp e novo elo
// Remover apex flag ao cair abaixo do mestre
