import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function getIconUrl(iconId?: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/11.14.1/img/profileicon/${iconId ?? 501}.png`
}

/**
 * Resolves a summoner-icon image from Community Dragon (the same source used to sync the icon
 * catalogue). Unlike {@link getIconUrl}, this covers every icon id — including ones newer than
 * the pinned Data Dragon patch — so it suits views that list the whole catalogue.
 */
export function getGameIconUrl(iconId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${iconId}.jpg`
}

export function block<T>(callback: () => T) {
  return callback()
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function defer(deferred: () => void) {
  return Promise.resolve().then(deferred)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
