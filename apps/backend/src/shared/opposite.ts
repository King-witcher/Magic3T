import { Team } from '@magic3t/common-types'

export function opposite(side: Team): Team {
  return side === Team.Order ? Team.Chaos : Team.Order
}
