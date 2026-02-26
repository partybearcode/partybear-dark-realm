import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './SignalDecode.css'

const pads = [
  { id: 0, label: 'A', color: '#ff0037' },
  { id: 1, label: 'B', color: '#ffe86f' },
  { id: 2, label: 'C', color: '#7bffd8' },
  { id: 3, label: 'D', color: '#b39cff' },
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function SignalDecode() {
  const { addXp, unlockAchievement, logArcadeRun } = useAuth()
  const [sequence, setSequence] = useState([])
  const [status, setStatus] = useState('idle')
  const [flashIndex, setFlashIndex] = useState(null)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [level, setLevel] = useState(0)
  const loggedRef = useRef(false)

  const statusLabel = useMemo(() => {
    if (status === 'idle') return 'Press start'
    if (status === 'playing') return 'Listen to the signal'
    if (status === 'input') return 'Repeat the pattern'
    if (status === 'lost') return 'Signal lost'
    return ''
  }, [status])

  useEffect(() => {
    if (status !== 'playing') return
    let cancelled = false
    const playSequence = async () => {
      for (const index of sequence) {
        if (cancelled) return
        setFlashIndex(index)
        await wait(350)
        setFlashIndex(null)
        await wait(200)
      }
      if (!cancelled) {
        setStatus('input')
      }
    }
    playSequence()
    return () => {
      cancelled = true
      setFlashIndex(null)
    }
  }, [status, sequence])

  const startGame = () => {
    const first = Math.floor(Math.random() * pads.length)
    loggedRef.current = false
    setSequence([first])
    setLevel(1)
    setPlayerIndex(0)
    setStatus('playing')
  }

  const finishGame = (finalLevel) => {
    const xpGain = Math.min(160, finalLevel * 14 + 10)
    addXp(xpGain)
    unlockAchievement('Arcade Initiate')
    if (finalLevel >= 5) unlockAchievement('Signal Reader')
    if (finalLevel >= 8) unlockAchievement('Cipher Master')
    if (!loggedRef.current) {
      loggedRef.current = true
      logArcadeRun({
        gameName: 'Signal Decode',
        category: 'Signal Decode',
        categoryKey: 'signal-decode',
        gameId: 'signal-decode',
        scoreLabel: 'Level',
        scoreValue: finalLevel,
        scoreUnit: '',
        scoreDirection: 'higher',
        xp: xpGain,
        note: `Max level ${finalLevel}`,
      })
    }
  }

  const handlePadClick = (index) => {
    if (status !== 'input') return
    if (sequence[playerIndex] === index) {
      const nextIndex = playerIndex + 1
      if (nextIndex >= sequence.length) {
        const nextLevel = sequence.length + 1
        setLevel(nextLevel)
        setPlayerIndex(0)
        setSequence((prev) => [...prev, Math.floor(Math.random() * pads.length)])
        setStatus('playing')
      } else {
        setPlayerIndex(nextIndex)
      }
    } else {
      setStatus('lost')
      finishGame(sequence.length)
    }
  }

  return (
    <section className="signal-decode">
      <div
        className="signal-banner"
        style={{
          backgroundImage: 'url(/images/signal-decode.webp)',
        }}
        aria-hidden="true"
      />
      <div className="signal-header">
        <h3>Signal Decode</h3>
        <p>Memorize the sequence before the broadcast fades.</p>
        <div className="signal-stats">
          <span>Level: {level}</span>
          <span>Status: {statusLabel}</span>
        </div>
      </div>
      <div className="signal-grid">
        {pads.map((pad) => (
          <button
            type="button"
            key={pad.id}
            className={`signal-pad ${flashIndex === pad.id ? 'is-flashing' : ''}`}
            onClick={() => handlePadClick(pad.id)}
            style={{ '--pad-color': pad.color }}
          >
            {pad.label}
          </button>
        ))}
      </div>
      <button type="button" className="signal-start" onClick={startGame}>
        {status === 'idle' || status === 'lost' ? 'Start decode' : 'Restart'}
      </button>
    </section>
  )
}

export default SignalDecode
