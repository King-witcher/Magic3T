/** Represents the configuration settings for a single bot */
export type SingleBotConfig = { uid: string } & (
  | {
      // Minimax bot configuration
      model: 'lmm'
      depth: number
    }
  | {
      // Random moves bot configuration
      model: 'random'
    }
)

/**
 * A bot name as sent by the user (bot0, bot1, bot2).
 *
 * Not to be confused with bot id.
 */
/** @deprecated */
export type BotName = 'bot0' | 'bot1' | 'bot2' | 'bot3'

/** Defines the configuration settings for all bots */
/** @deprecated */
export type BotConfigRow = Record<BotName, SingleBotConfig>
