import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function getIconUrl(iconId?: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/11.14.1/img/profileicon/${iconId ?? 501}.png`
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
