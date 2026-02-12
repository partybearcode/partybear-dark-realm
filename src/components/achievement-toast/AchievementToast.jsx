import { useEffect } from 'react'
import { FaCrown } from 'react-icons/fa6'
import { useAuth } from '../../context/AuthContext'
import { getAchievementIcon } from '../../utils/achievementUtils'
import './AchievementToast.css'

function AchievementToast() {
  const { achievementQueue, dismissAchievement } = useAuth()

  useEffect(() => {
    const timers = achievementQueue.map((item) =>
      setTimeout(() => dismissAchievement(item.id), 4000)
    )
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [achievementQueue, dismissAchievement])

  if (!achievementQueue.length) return null

  return (
    <div className="achievement-toast">
      {achievementQueue.map((item) => (
        (() => {
          const isPlatinum = String(item.title).toLowerCase().startsWith('platinum trophy')
          const { Icon, color } = isPlatinum
            ? { Icon: FaCrown, color: '#e5e4e2' }
            : getAchievementIcon(item.title)
          const label = isPlatinum ? 'Platinum Trophy' : 'Achievement Unlocked'
          const title = isPlatinum
            ? String(item.title).replace(/platinum trophy:\s*/i, '')
            : item.title
          return (
            <div
              key={item.id}
              className={`achievement-card ${isPlatinum ? 'is-platinum' : ''}`}
            >
              <div
                className="achievement-icon"
                style={{ backgroundColor: color }}
              >
                <Icon />
              </div>
              <div className="achievement-text">
                <span>{label}</span>
                <strong>{title}</strong>
              </div>
            </div>
          )
        })()
      ))}
    </div>
  )
}

export default AchievementToast
