import { League } from '@magic3t/common-types'

export type LeagueInfo = {
  emblem: string
  emblemOldest: string
  wing: string
  icon: string
  plate: string
  name: string
  animation?: string
}

export const leaguesMap: Record<League, LeagueInfo> = {
  [League.Provisional]: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/unranked.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/provisional.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/unranked.svg`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/provisional-1.png`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/wings/provisional-1.png`,
    name: 'Unranked',
  },
  [League.Bronze]: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/bronze.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/bronze.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/bronze.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/bronze.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/bronze.png`,
    name: 'Bronze',
  },
  [League.Silver]: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/silver.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/silver.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/silver.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/silver.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/silver.png`,
    name: 'Silver',
  },
  [League.Gold]: {
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/gold.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/gold.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/gold.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/gold.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/gold.png`,
    name: 'Gold',
  },
  [League.Diamond]: {
    // animation: `${import.meta.env.VITE_CDN_URL}/leagues/videos/diamond.webm`,
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/diamond.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/diamond.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/diamond.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/diamond.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/diamond.png`,
    name: 'Diamond',
  },
  [League.Master]: {
    animation: `${import.meta.env.VITE_CDN_URL}/leagues/videos/master.webm`,
    emblem: `${import.meta.env.VITE_CDN_URL}/leagues/emblems/master.png`,
    emblemOldest: `${import.meta.env.VITE_CDN_URL}/ranks-old/master.png`,
    wing: `${import.meta.env.VITE_CDN_URL}/leagues/wings/master.png`,
    icon: `${import.meta.env.VITE_CDN_URL}/leagues/icons/master.svg`,
    plate: `${import.meta.env.VITE_CDN_URL}/leagues/plates/master.png`,
    name: 'Master',
  },
  [League.Challenger]: {
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
