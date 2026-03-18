import { Team } from '@magic3t/common-types'
import { MatchDocumentEvent, UserRow } from '@magic3t/database-types'
import { RankConverter, RatingState } from '@/modules/rating'

type FinishedMatchContextPlayer = {
  row: UserRow
  matchScore: number
  timeSpent: number
  newRating: RatingState
}

export type FinishedMatchContext = {
  order: FinishedMatchContextPlayer
  chaos: FinishedMatchContextPlayer
  winner: Team | null

  rankConverter: RankConverter
  startedAt: Date
  events: MatchDocumentEvent[]
  ranked: boolean
}
// Atualizar elo e fator k do jogador
// Salvar partida com elo, lp total e ganho de lp
// Avisar jogadores do resultado da partida, incluindo ganho de lp e novo elo
// Remover apex flag ao cair abaixo do mestre
