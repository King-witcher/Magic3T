import type { League } from '@magic3t/common-types'

export type LeagueInfo = {
  emblem: string
  emblemOldest: string
  wing: string
  icon: string
  plate: string
  name: string
  animation?: string
}

export const provisionalLeagueInfo: LeagueInfo = {
  emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/unranked.png`,
  emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/provisional.png`,
  icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/unranked.svg`,
  wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/provisional-1.png`,
  plate: `${import.meta.env.VITE_CDN_URL}/leagues/wings/provisional-1.png`,
  name: 'Unranked',
}

export const leaguesMap: Record<League, LeagueInfo> = {
  bronze: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/bronze.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/bronze.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/bronze.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/bronze.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/bronze.png`,
    name: 'Bronze',
  },
  silver: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/silver.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/silver.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/silver.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/silver.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/silver.png`,
    name: 'Silver',
  },
  gold: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/gold.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/gold.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/gold.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/gold.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/gold.png`,
    name: 'Gold',
  },
  diamond: {
    // animation: `${import.meta.env.VITE_CDN_URL}/leagues/videos/diamond.webm`,
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/diamond.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/diamond.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/diamond.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/diamond.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/diamond.png`,
    name: 'Diamond',
  },
  master: {
    animation: `${import.meta.env.VITE_CDN_URL}/leagues/videos/master.webm`,
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/master.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/master.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/master.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/master.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/master.png`,
    name: 'Master',
  },
  challenger: {
    animation: `${import.meta.env.VITE_CDN_URL}/leagues/videos/challenger.webm`,
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/challenger.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/challenger.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/challenger.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/challenger.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/challenger.png`,
    name: 'Challenger',
  },
}

export const divisionMap = {
  0: '',
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
}
