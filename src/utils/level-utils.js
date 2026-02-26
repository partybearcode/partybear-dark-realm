const baseXp = 120
const growthRate = 1.18

const getLevelInfo = (xp = 0) => {
  let level = 1
  let previousXp = 0
  let nextLevelXp = baseXp

  while (xp >= nextLevelXp) {
    level += 1
    previousXp = nextLevelXp
    nextLevelXp = Math.round(nextLevelXp * growthRate + baseXp)
  }

  const progress = Math.max(
    0,
    Math.min(1, (xp - previousXp) / Math.max(nextLevelXp - previousXp, 1))
  )

  return { level, previousXp, nextLevelXp, progress }
}

export { getLevelInfo }
