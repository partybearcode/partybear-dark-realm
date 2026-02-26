import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './MemoryMatch.css'

const symbols = ['SK', 'FX', 'BN', 'CH', 'FR', 'PW', 'GN', 'VL']

function shuffle(array) {
  return array
    .map((item) => ({ sort: Math.random(), value: item }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.value)
}

function MemoryMatch() {
  const { addXp, unlockAchievement, logArcadeRun } = useAuth()
  const [cards, setCards] = useState(() => {
    const pairs = symbols.flatMap((symbol, index) => [
      { id: `${index}-a`, symbol, matched: false },
      { id: `${index}-b`, symbol, matched: false },
    ])
    return shuffle(pairs)
  })
  const [flipped, setFlipped] = useState([])
  const [moves, setMoves] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [completed, setCompleted] = useState(false)
  const loggedRef = useRef(false)

  const allMatched = useMemo(
    () => cards.every((card) => card.matched),
    [cards]
  )

  const resetGame = () => {
    const pairs = symbols.flatMap((symbol, index) => [
      { id: `${index}-a`, symbol, matched: false },
      { id: `${index}-b`, symbol, matched: false },
    ])
    setCards(shuffle(pairs))
    setFlipped([])
    setMoves(0)
    setStartedAt(null)
    setCompleted(false)
    loggedRef.current = false
  }

  const handleFlip = (card) => {
    if (card.matched || flipped.find((item) => item.id === card.id)) return
    if (flipped.length === 2) return
    if (!startedAt) setStartedAt(Date.now())

    const nextFlipped = [...flipped, card]
    setFlipped(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves((prev) => prev + 1)
      const [first, second] = nextFlipped
      if (first.symbol === second.symbol) {
        setCards((prevCards) =>
          prevCards.map((prevCard) =>
            prevCard.symbol === first.symbol
              ? { ...prevCard, matched: true }
              : prevCard
          )
        )
        setFlipped([])
      } else {
        setTimeout(() => setFlipped([]), 700)
      }
    }
  }

  useEffect(() => {
    if (!allMatched || completed) return
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0
    setCompleted(true)
    addXp(50)
    unlockAchievement('Arcade Initiate')
    unlockAchievement('Memory Crypt Cleared')
    if (elapsed && elapsed <= 60) {
      unlockAchievement('Memory Sprinter')
    }
    if (!loggedRef.current) {
      loggedRef.current = true
      logArcadeRun({
        gameName: 'Memory Match',
        category: 'Memory Match',
        categoryKey: 'memory-match',
        gameId: 'memory-match',
        scoreLabel: 'Moves',
        scoreValue: moves,
        scoreUnit: '',
        scoreDirection: 'lower',
        xp: 50,
        note: elapsed ? `Cleared in ${elapsed}s` : 'Cleared run',
      })
    }
  }, [allMatched, completed, startedAt, addXp, unlockAchievement, logArcadeRun, moves])

  return (
    <section className="memory-match">
      <div
        className="memory-banner"
        style={{
          backgroundImage: 'url(/images/memory-game.webp)',
        }}
        aria-hidden="true"
      >
        <div className="memory-banner-glow" />
      </div>
      <div className="memory-header">
        <h3>Memory Crypt</h3>
        <p>Match the symbols before the nightmares close in.</p>
        <div className="memory-stats">
          <span>Moves: {moves}</span>
          <span>Status: {allMatched ? 'Cleared' : 'In progress'}</span>
        </div>
      </div>
      <div className="memory-grid">
        {cards.map((card) => {
          const isFlipped =
            card.matched || flipped.find((item) => item.id === card.id)
          return (
            <button
              type="button"
              key={card.id}
              className={`memory-card ${isFlipped ? 'is-flipped' : ''}`}
              onClick={() => handleFlip(card)}
            >
              <span>{isFlipped ? card.symbol : '?'}</span>
            </button>
          )
        })}
      </div>
      <button type="button" className="memory-reset" onClick={resetGame}>
        Reset memory
      </button>
    </section>
  )
}

export default MemoryMatch
