/** Represnets the configuration settings for the rating system */
export interface RatingConfigRow {
  /** The base rating in the game, which is assigned to every player at the beginning */
  initial_elo: number

  /** The length of each league in elo points */
  elo_per_league: number

  /** The initial league assigned to a player with initial_elo */
  initial_league_index: number

  /** The lowest possible k-factor towrards which values are deflated */
  least_k_factor: number

  /** The k-factor set to a fresh player */
  initial_k_factor: number

  /** The factor by which the k-factor is deflated towards the final k-factor after each match */
  k_deflation_factor: number
}
