import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { getLevelInfo } from '../../utils/levelUtils'
import { FaTrophy } from 'react-icons/fa6'
import { getTrophyTier, totalAchievements } from '../../utils/achievementUtils'
import './LeaderboardPage.css'

function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLeaders = async () => {
      try {
        const leaderboardQuery = query(
          collection(db, 'users'),
          orderBy('xp', 'desc')
        )
        const snapshot = await getDocs(leaderboardQuery)
        setLeaders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setError('')
      } catch (err) {
        setError('Leaderboard unavailable. Check your connection.')
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaders()
  }, [])

  return (
    <main className="leaderboard-page">
      <section className="leaderboard-card">
        <h1>Global XP Leaderboard</h1>
        <p>See who survives the longest in the Dark Realm.</p>
        {isLoading ? <p>Loading leaderboard...</p> : null}
        {error ? <p>{error}</p> : null}
        {!isLoading && !error && leaders.length === 0 ? (
          <p>No entries yet. Play the arcade to be the first.</p>
        ) : null}
        {!isLoading && !error ? (
          <div className="leaderboard-list">
            {leaders.map((user, index) => {
              const levelInfo = getLevelInfo(user.xp || 0)
              const achievementCount = (user.achievements || []).length
              const trophyTier = getTrophyTier(
                achievementCount,
                totalAchievements
              )
              return (
                <NavLink
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="leaderboard-row"
                >
                  <span className="leaderboard-rank">#{index + 1}</span>
                  <div className="leaderboard-user">
                    <img
                      src={user.photoURL || 'https://picsum.photos/seed/avatar/80/80'}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                    <div>
                      <div className="leaderboard-name">
                        {trophyTier !== 'none' ? (
                          <span
                            className={`trophy-badge trophy-${trophyTier}`}
                            aria-label={`${trophyTier} trophy`}
                          >
                            <FaTrophy />
                          </span>
                        ) : null}
                        <strong
                          className={`trophy-name ${trophyTier !== 'none' ? `tier-${trophyTier}` : ''}`}
                        >
                          {user.displayName}
                        </strong>
                      </div>
                      <span>
                        Level {levelInfo.level} · {user.xp || 0} XP
                      </span>
                    </div>
                  </div>
                  <span className="leaderboard-achievements">
                    {achievementCount}/{totalAchievements} achievements
                  </span>
                </NavLink>
              )
            })}
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default LeaderboardPage
