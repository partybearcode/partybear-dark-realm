import { useEffect, useRef, useState } from 'react'
import GhostTap from '../../components/ghost-tap/GhostTap'
import SignalDecode from '../../components/signal-decode/SignalDecode'
import NightWatch from '../../components/night-watch/NightWatch'
import MemoryMatch from '../../components/memory-match/MemoryMatch'
import ReactionTest from '../../components/reaction-test/ReactionTest'
import ShadowRunner from '../../components/shadow-runner/ShadowRunner'
import './ArcadePage.css'

function ArcadeCabinet({ children, gameId }) {
  const cabinetRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === cabinetRef.current)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cabinetRef.current?.requestFullscreen?.()
    } else if (document.fullscreenElement === cabinetRef.current) {
      document.exitFullscreen?.()
    }
  }

  return (
    <div className="arcade-cabinet" ref={cabinetRef} id={gameId}>
      <button
        type="button"
        className="cabinet-fullscreen"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Play fullscreen'}
      >
        {isFullscreen ? 'Exit' : 'Fullscreen'}
      </button>
      {children}
    </div>
  )
}

function ArcadePage() {
  return (
    <main className="arcade">
      <section className="arcade-hero">
        <div className="arcade-intro">
          <span>Phantom Arcade</span>
          <h1>Earn XP with real-time horror games.</h1>
          <p>
            Every cabinet below ties into your XP and achievements. Clear a
            challenge to unlock new badges and climb the global leaderboard.
          </p>
        </div>
        <div className="arcade-panel">
          <h2>Achievement Targets</h2>
          <ul>
            <li>Arcade Initiate</li>
            <li>Ghost Tapper / Phantom Striker</li>
            <li>Signal Reader / Cipher Master</li>
            <li>Night Watcher / Night Guard</li>
          </ul>
        </div>
      </section>

      <section className="arcade-grid">
        <ArcadeCabinet gameId="ghost-tap">
          <GhostTap />
        </ArcadeCabinet>
        <ArcadeCabinet gameId="signal-decode">
          <SignalDecode />
        </ArcadeCabinet>
        <ArcadeCabinet gameId="night-watch">
          <NightWatch />
        </ArcadeCabinet>
        <ArcadeCabinet gameId="memory-match">
          <MemoryMatch />
        </ArcadeCabinet>
        <ArcadeCabinet gameId="reaction-test">
          <ReactionTest />
        </ArcadeCabinet>
        <ArcadeCabinet gameId="shadow-runner">
          <ShadowRunner />
        </ArcadeCabinet>
      </section>
    </main>
  )
}

export default ArcadePage
