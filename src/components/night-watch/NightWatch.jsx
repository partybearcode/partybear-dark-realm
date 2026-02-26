import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './NightWatch.css'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function NightWatch() {
  const { addXp, unlockAchievement, logArcadeRun } = useAuth()
  const [status, setStatus] = useState('idle')
  const [meter, setMeter] = useState(50)
  const [safeTime, setSafeTime] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [bestTime, setBestTime] = useState(0)
  const timerRef = useRef(null)
  const watcherUnlockedRef = useRef(false)
  const loggedRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    if (status !== 'running') return
    timerRef.current = setInterval(() => {
      setMeter((prev) => {
        const delta = isHolding ? 2.6 : -1.8
        const next = clamp(prev + delta, 0, 100)
        const inZone = next >= 42 && next <= 58
        setSafeTime((prevSafe) => (inZone ? prevSafe + 0.06 : 0))
        return next
      })
    }, 60)

    return () => clearTimer()
  }, [status, isHolding])

  useEffect(() => {
    if (status !== 'running') return
    if (meter <= 0 || meter >= 100) {
      setStatus('failed')
      clearTimer()
      setBestTime((prev) => Math.max(prev, Math.floor(safeTime)))
    }
  }, [meter, status, safeTime])

  useEffect(() => {
    if (status !== 'running') return
    setBestTime((prev) => Math.max(prev, Math.floor(safeTime)))
    if (!watcherUnlockedRef.current && safeTime >= 10) {
      watcherUnlockedRef.current = true
      unlockAchievement('Night Watcher')
    }
    if (safeTime >= 20) {
      setStatus('won')
      clearTimer()
      addXp(120)
      unlockAchievement('Arcade Initiate')
      unlockAchievement('Night Guard')
      if (!loggedRef.current) {
        loggedRef.current = true
        logArcadeRun({
          gameName: 'Night Watch',
          category: 'Night Watch',
          categoryKey: 'night-watch',
          gameId: 'night-watch',
          scoreLabel: 'Safe Time',
          scoreValue: Math.round(safeTime),
          scoreUnit: 's',
          scoreDirection: 'higher',
          xp: 120,
          note: 'Held the safe zone for 20s.',
        })
      }
    }
  }, [safeTime, status, unlockAchievement, addXp, logArcadeRun])

  const startGame = () => {
    clearTimer()
    watcherUnlockedRef.current = false
    loggedRef.current = false
    setStatus('running')
    setMeter(50)
    setSafeTime(0)
  }

  return (
    <section className="night-watch">
      <div
        className="night-banner"
        style={{ backgroundImage: 'url(/images/night-watch.webp)' }}
        aria-hidden="true"
      />
      <div className="night-header">
        <h3>Night Watch</h3>
        <p>Hold the signal in the safe zone for 20 seconds.</p>
        <div className="night-stats">
          <span>Safe time: {safeTime.toFixed(1)}s</span>
          <span>Best: {bestTime}s</span>
        </div>
      </div>
      <div className={`night-meter ${status}`}>
        <div className="night-target" />
        <div className="night-fill" style={{ height: `${meter}%` }} />
      </div>
      <div className="night-controls">
        <button type="button" className="night-start" onClick={startGame}>
          {status === 'running' ? 'Hold focus' : 'Start watch'}
        </button>
        <button
          type="button"
          className={`night-hold ${isHolding ? 'is-held' : ''}`}
          onMouseDown={() => setIsHolding(true)}
          onMouseUp={() => setIsHolding(false)}
          onMouseLeave={() => setIsHolding(false)}
          onTouchStart={() => setIsHolding(true)}
          onTouchEnd={() => setIsHolding(false)}
        >
          Hold
        </button>
      </div>
      {status === 'failed' ? (
        <p className="night-status">Signal cracked. Start again.</p>
      ) : null}
      {status === 'won' ? (
        <p className="night-status">Signal stabilized. Achievement unlocked.</p>
      ) : null}
    </section>
  )
}

export default NightWatch
