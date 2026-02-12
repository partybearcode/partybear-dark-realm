import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './ShadowRunner.css'

const lanePositions = ['18%', '50%', '82%']

function ShadowRunner() {
  const { addXp, unlockAchievement } = useAuth()
  const [playerLane, setPlayerLane] = useState(1)
  const [obstacles, setObstacles] = useState([])
  const [status, setStatus] = useState('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const crashedRef = useRef(false)
  const startRef = useRef(0)

  useEffect(() => {
    const handleKey = (event) => {
      if (status !== 'running') return
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        setPlayerLane((prev) => Math.max(0, prev - 1))
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        setPlayerLane((prev) => Math.min(2, prev + 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [status])

  useEffect(() => {
    if (status !== 'running') return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const speed = 0.7 + Math.min(1.2, elapsed / 20)
      setScore(Math.round(elapsed * 10) / 10)

      setObstacles((prev) => {
        const next = prev
          .map((obs) => ({ ...obs, y: obs.y + speed * 2.2 }))
          .filter((obs) => obs.y < 110)

        const crash = next.some(
          (obs) => obs.lane === playerLane && obs.y > 78 && obs.y < 92
        )
        if (crash && !crashedRef.current) {
          crashedRef.current = true
          handleCrash(elapsed)
        }
        return next
      })
    }, 60)

    return () => clearInterval(interval)
  }, [status, playerLane])

  useEffect(() => {
    if (status !== 'running') return undefined

    const spawnObstacle = () => {
      setObstacles((prev) => {
        const active = prev.filter((obs) => obs.y < 110)
        if (active.length >= 2) return active

        const hasRecent = active.some((obs) => obs.y < 28)
        if (hasRecent) return active

        const blockedLanes = new Set(
          active.filter((obs) => obs.y < 40).map((obs) => obs.lane)
        )
        const availableLanes = [0, 1, 2].filter(
          (lane) => !blockedLanes.has(lane)
        )
        const lanePool = availableLanes.length ? availableLanes : [0, 1, 2]
        const lane = lanePool[Math.floor(Math.random() * lanePool.length)]

        return [
          ...active,
          {
            id: `${Date.now()}-${Math.random()}`,
            lane,
            y: -12,
          },
        ]
      })
    }

    spawnObstacle()
    const spawnTimer = setInterval(spawnObstacle, 1100)

    return () => clearInterval(spawnTimer)
  }, [status])

  const handleCrash = (elapsed) => {
    setStatus('crashed')
    const finalScore = Math.max(0, Math.round(elapsed))
    setBestScore((prev) => (finalScore > prev ? finalScore : prev))
    const xpGain = Math.min(120, Math.max(20, Math.round(finalScore * 2)))
    addXp(xpGain)
    unlockAchievement('Arcade Initiate')
    if (finalScore >= 30) unlockAchievement('Shadow Runner 30s')
    if (finalScore >= 60) unlockAchievement('Shadow Runner 60s')
  }

  const startGame = () => {
    crashedRef.current = false
    setPlayerLane(1)
    setObstacles([])
    setScore(0)
    startRef.current = Date.now()
    setStatus('running')
  }

  return (
    <section className="shadow-runner">
      <div
        className="shadow-banner"
        style={{ backgroundImage: 'url(/images/shadow-runner.webp)' }}
        aria-hidden="true"
      >
        <div className="shadow-banner-glow" />
      </div>
      <div className="shadow-header">
        <h3>Shadow Runner</h3>
        <p>Move left or right to survive the tunnel of jaws.</p>
        <div className="shadow-stats">
          <span>Time: {score.toFixed(1)}s</span>
          <span>Best: {bestScore}s</span>
        </div>
      </div>

      <div className={`runner-stage ${status}`}>
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className="runner-shadow"
            style={{ left: lanePositions[obs.lane], top: `${obs.y}%` }}
          />
        ))}
        <div
          className="runner-player"
          style={{ left: lanePositions[playerLane] }}
          aria-label="Bear Alpha runner"
        >
          {status === 'running' ? (
            <>
              <img
                className="runner-sprite sprite-one"
                src="/images/bear-walk1.webp"
                alt="Bear Alpha walk frame 1"
              />
              <img
                className="runner-sprite sprite-two"
                src="/images/bear-walk2.webp"
                alt="Bear Alpha walk frame 2"
              />
            </>
          ) : (
            <img
              className="runner-sprite sprite-idle"
              src="/images/bear-idle.webp"
              alt="Bear Alpha idle"
            />
          )}
        </div>
        {status !== 'running' && (
          <div className="runner-overlay">
            <p>
              {status === 'idle'
                ? 'Press start to run.'
                : 'Crash detected. Try again.'}
            </p>
          </div>
        )}
      </div>

      <div className="runner-controls">
        <button
          type="button"
          onClick={() => setPlayerLane((prev) => Math.max(0, prev - 1))}
          aria-label="Move left"
        >
          Left
        </button>
        <button
          type="button"
          onClick={startGame}
          className="runner-start"
          disabled={status === 'running'}
        >
          {status === 'running' ? 'Running...' : 'Start run'}
        </button>
        <button
          type="button"
          onClick={() => setPlayerLane((prev) => Math.min(2, prev + 1))}
          aria-label="Move right"
        >
          Right
        </button>
      </div>
    </section>
  )
}

export default ShadowRunner
