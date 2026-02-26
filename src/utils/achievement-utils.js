import {
  FaSkull,
  FaTrophy,
  FaMedal,
  FaStar,
  FaGhost,
  FaGamepad,
  FaBolt,
  FaMoon,
} from 'react-icons/fa6'

const achievementRules = [
  { pattern: /read all/i, icon: FaTrophy, color: '#ffe86f' },
  { pattern: /read 10/i, icon: FaMedal, color: '#f7b6ff' },
  { pattern: /read 5/i, icon: FaStar, color: '#7bffd8' },
  { pattern: /arcade/i, icon: FaGamepad, color: '#ff0037' },
  { pattern: /ghost/i, icon: FaGhost, color: '#7dd3fc' },
  { pattern: /signal/i, icon: FaBolt, color: '#ffe86f' },
  { pattern: /night/i, icon: FaMoon, color: '#b39cff' },
  { pattern: /shadow/i, icon: FaSkull, color: '#ff0037' },
]

const achievementTitles = [
  'Arcade Initiate',
  'Ghost Tapper',
  'Phantom Striker',
  'Signal Reader',
  'Cipher Master',
  'Night Watcher',
  'Night Guard',
  'Memory Crypt Cleared',
  'Memory Sprinter',
  'Shadow Runner 30s',
  'Shadow Runner 60s',
  'Reflex Legend',
  'Reflex Hunter',
  'Read 5 comics',
  'Read 10 comics',
  'Read all comics',
]

const hasAllAchievements = (list = []) => {
  const set = new Set(list)
  return achievementTitles.every((title) => set.has(title))
}

const getAchievementIcon = (title = '') => {
  const safeTitle = String(title)
  const match = achievementRules.find((rule) => rule.pattern.test(safeTitle))
  if (match) {
    return { Icon: match.icon, color: match.color }
  }
  return { Icon: FaSkull, color: '#ff0037' }
}

const totalAchievements = achievementTitles.length

const getTrophyTier = (count = 0, total = totalAchievements) => {
  if (!total) return 'none'
  if (count >= total) return 'platinum'
  if (count >= Math.ceil(total * 0.75)) return 'gold'
  if (count >= Math.ceil(total * 0.5)) return 'silver'
  if (count >= Math.ceil(total * 0.25)) return 'bronze'
  return 'none'
}

export {
  getAchievementIcon,
  achievementTitles,
  totalAchievements,
  hasAllAchievements,
  getTrophyTier,
}
