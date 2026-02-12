import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './ReactionTest.css'

function ReactionTest() {
  const { addXp, unlockAchievement } = useAuth()
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('Tap to begin the reflex test.')
  const [reactionTime, setReactionTime] = useState(null)
  const [timerId, setTimerId] = useState(null)
  const [startTime, setStartTime] = useState(0)

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [timerId])

  const startTest = () => {
    if (status !== 'idle' && status !== 'done' && status !== 'tooSoon') return
    setReactionTime(null)
    setStatus('waiting')
    setMessage('Wait for the glow...')
    const delay = 800 + Math.random() * 1600
    const id = setTimeout(() => {
      setStatus('go')
      setMessage('NOW!')
      setStartTime(performance.now())
    }, delay)
    setTimerId(id)
  }

  const handleClick = () => {
    if (status === 'waiting') {
      if (timerId) clearTimeout(timerId)
      setStatus('tooSoon')
      setMessage('Too soon. The animatronic heard you.')
      return
    }

    if (status === 'go') {
      const time = Math.round(performance.now() - startTime)
      setReactionTime(time)
      setStatus('done')
      setMessage(`Reaction time: ${time}ms`)

      const xpGain = Math.max(10, Math.round((500 - time) / 4))
      addXp(xpGain)
      unlockAchievement('Arcade Initiate')
      if (time <= 250) unlockAchievement('Reflex Legend')
      if (time <= 350) unlockAchievement('Reflex Hunter')
    }
  }

  return (
    <section className={`reaction-test ${status}`}>
      <div
        className="reaction-banner"
        style={{
          backgroundImage: 'url(/images/reflex-chamber.webp)',
        }}
        aria-hidden="true"
      >
        <div className="reaction-banner-glow" />
      </div>
      <div className="reaction-header">
        <h3>Reflex Chamber</h3>
        <p>Test how fast you can react before the light fades.</p>
      </div>
      <button
        type="button"
        className="reaction-area"
        onClick={status === 'idle' || status === 'done' || status === 'tooSoon' ? startTest : handleClick}
      >
        <span>{message}</span>
        {reactionTime ? <strong>+XP gained</strong> : null}
      </button>
    </section>
  )
}

export default ReactionTest
