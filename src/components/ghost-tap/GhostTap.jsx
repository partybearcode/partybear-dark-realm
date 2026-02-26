import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './GhostTap.css'

const tiles = Array.from({ length: 9 }, (_, index) => index)

function GhostTap() {
  const { addXp, unlockAchievement, logArcadeRun } = useAuth()
  const [activeTile, setActiveTile] = useState(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [status, setStatus] = useState('idle')
  const intervalRef = useRef(null)
  const timerRef = useRef(null)
  const loggedRef = useRef(false)

  const accuracyLabel = useMemo(() => {
    if (score >= 25) return 'Phantom'
    if (score >= 15) return 'Hunter'
    if (score >= 8) return 'Watcher'
    return 'Rookie'
  }, [score])

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    if (status !== 'running') return
    intervalRef.current = setInterval(() => {
      setActiveTile(Math.floor(Math.random() * tiles.length))
    }, 550)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimers()
  }, [status])

  useEffect(() => {
    if (status !== 'running' || timeLeft > 0) return
    clearTimers()
    setStatus('done')
    setActiveTile(null)
    const xpGain = Math.min(140, score * 4 + 10)
    addXp(xpGain)
    unlockAchievement('Arcade Initiate')
    if (score >= 15) unlockAchievement('Ghost Tapper')
    if (score >= 25) unlockAchievement('Phantom Striker')
    if (!loggedRef.current) {
      loggedRef.current = true
      logArcadeRun({
        gameName: 'Ghost Tap',
        category: 'Ghost Tap',
        categoryKey: 'ghost-tap',
        gameId: 'ghost-tap',
        scoreLabel: 'Taps',
        scoreValue: score,
        scoreUnit: '',
        scoreDirection: 'higher',
        xp: xpGain,
        note: `Rank ${accuracyLabel}`,
      })
    }
  }, [timeLeft, status, score, addXp, unlockAchievement, logArcadeRun, accuracyLabel])

  const startGame = () => {
    clearTimers()
    loggedRef.current = false
    setScore(0)
    setTimeLeft(30)
    setActiveTile(Math.floor(Math.random() * tiles.length))
    setStatus('running')
  }

  const handleTileClick = (index) => {
    if (status !== 'running') return
    if (index === activeTile) {
      setScore((prev) => prev + 1)
      setActiveTile(Math.floor(Math.random() * tiles.length))
    }
  }

  return (
    <section className="ghost-tap">
      <div
        className="ghost-banner"
        style={{ backgroundImage: 'url(/images/ghost-tap.webp)' }}
        aria-hidden="true"
      />
      <div className="ghost-header">
        <h3>Ghost Tap</h3>
        <p>Hit the haunted tile before the light escapes.</p>
        <div className="ghost-stats">
          <span>Time: {timeLeft}s</span>
          <span>Score: {score}</span>
          <span>Rank: {accuracyLabel}</span>
        </div>
      </div>
      <div className={`ghost-grid ${status}`}>
        {tiles.map((tile) => (
          <button
            type="button"
            key={tile}
            className={`ghost-tile ${activeTile === tile ? 'is-active' : ''}`}
            onClick={() => handleTileClick(tile)}
          >
            {activeTile === tile ? '!' : ''}
          </button>
        ))}
      </div>
      <button type="button" className="ghost-start" onClick={startGame}>
        {status === 'running' ? 'Keep tapping' : 'Start hunt'}
      </button>
    </section>
  )
}

export default GhostTap
