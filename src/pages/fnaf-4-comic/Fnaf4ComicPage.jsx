import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getComicPage } from '../../data/comicData'
import './Fnaf4ComicPage.css'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function Fnaf4ComicPage() {
  const page = getComicPage('fnaf-4')
  const sceneRef = useRef(null)
  const scrubRef = useRef(null)
  const forwardVideoRef = useRef(null)
  const reverseVideoRef = useRef(null)
  const activeDirectionRef = useRef('down')
  const lastActiveTimeRef = useRef(0)
  const lastScrollYRef = useRef(0)
  const lastScrollTsRef = useRef(0)
  const lastMotionTsRef = useRef(0)
  const animationFrameRef = useRef(0)
  const [scrollDirection, setScrollDirection] = useState('neutral')
  const [scrubProgress, setScrubProgress] = useState(0)
  const [scrollRate, setScrollRate] = useState(1)
  const [forwardReady, setForwardReady] = useState(false)
  const [reverseReady, setReverseReady] = useState(false)
  const nightmareLore = [
    'The 8-bit minigames follow a crying child afraid of the animatronics and locked in a cycle of fear.',
    "The minigame setting points to 1983 and Fredbear's Family Diner, before the classic pizzeria era.",
    "The final minigame scene strongly implies the Bite of '83, one of the major events in the timeline.",
    'The gameplay nightmares are widely read as trauma-driven hallucinations tied to the child and his memories.',
  ]
  const scareLines = [
    'Listen at the left door.',
    'Freddles are multiplying on the bed.',
    'The closet is no longer safe.',
    'Fredbear is inside the room.',
    'Do not flash twice.',
  ]

  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]')
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.2 }
    )

    revealItems.forEach((item) => revealObserver.observe(item))

    return () => {
      revealItems.forEach((item) => revealObserver.unobserve(item))
    }
  }, [])

  useEffect(() => {
    const syncDirection = (nextDirection) => {
      const previousDirection = activeDirectionRef.current
      if (previousDirection === nextDirection) return

      const forward = forwardVideoRef.current
      const reverse = reverseVideoRef.current
      if (!forward || !reverse || !forward.duration || !reverse.duration) {
        activeDirectionRef.current = nextDirection
        return
      }

      if (nextDirection === 'down' && previousDirection === 'up') {
        forward.currentTime = clamp(
          forward.duration - reverse.currentTime,
          0,
          forward.duration
        )
      }

      if (nextDirection === 'up' && previousDirection === 'down') {
        reverse.currentTime = clamp(
          reverse.duration - forward.currentTime,
          0,
          reverse.duration
        )
      }

      if (nextDirection !== 'neutral' && previousDirection === 'neutral') {
        if (nextDirection === 'down') {
          forward.currentTime = clamp(
            lastActiveTimeRef.current,
            0,
            forward.duration
          )
        } else if (nextDirection === 'up') {
          reverse.currentTime = clamp(
            reverse.duration - lastActiveTimeRef.current,
            0,
            reverse.duration
          )
        }
      }

      activeDirectionRef.current = nextDirection
    }

    const applyScrollEffects = (timestamp = performance.now()) => {
      const currentScrollY = window.scrollY
      const deltaY = currentScrollY - lastScrollYRef.current
      const elapsed = Math.max(timestamp - lastScrollTsRef.current, 16)
      const velocity = deltaY / (elapsed / 1000)

      let direction = activeDirectionRef.current
      if (Math.abs(velocity) > 2) {
        direction = velocity > 0 ? 'down' : 'up'
        lastMotionTsRef.current = timestamp
      } else if (timestamp - lastMotionTsRef.current > 120) {
        direction = 'neutral'
      }

      syncDirection(direction)
      setScrollDirection((prevDirection) =>
        prevDirection === direction ? prevDirection : direction
      )

      const targetRate = clamp(Math.abs(velocity) / 450, 0.9, 3.4)
      setScrollRate((prevRate) =>
        Math.abs(prevRate - targetRate) < 0.02 ? prevRate : targetRate
      )

      const forward = forwardVideoRef.current
      const reverse = reverseVideoRef.current
      if (forward && reverse) {
        if (direction === 'neutral') {
          if (activeDirectionRef.current === 'down') {
            lastActiveTimeRef.current = forward.currentTime
          } else if (activeDirectionRef.current === 'up') {
            lastActiveTimeRef.current = reverse.duration
              ? reverse.duration - reverse.currentTime
              : lastActiveTimeRef.current
          }
          forward.pause()
          reverse.pause()
        } else if (direction === 'down') {
          reverse.pause()
          forward.playbackRate = targetRate
          if (forward.paused) forward.play().catch(() => {})
        } else {
          forward.pause()
          reverse.playbackRate = targetRate
          if (reverse.paused) reverse.play().catch(() => {})
        }
      }

      lastScrollYRef.current = currentScrollY
      lastScrollTsRef.current = timestamp

      if (sceneRef.current) {
        const layers = sceneRef.current.querySelectorAll('[data-speed]')
        layers.forEach((layer) => {
          const speed = Number(layer.getAttribute('data-speed') || 0)
          layer.style.transform = `translate3d(0, ${currentScrollY * speed}px, 0)`
        })
      }

      if (scrubRef.current) {
        const sectionTop = scrubRef.current.offsetTop
        const sectionHeight = scrubRef.current.offsetHeight
        const start = sectionTop - window.innerHeight * 0.1
        const end = sectionTop + sectionHeight - window.innerHeight * 0.9
        const progress = clamp((currentScrollY - start) / Math.max(end - start, 1), 0, 1)
        setScrubProgress(progress)
      }

      animationFrameRef.current = 0
    }

    const handleScroll = () => {
      if (animationFrameRef.current) return
      animationFrameRef.current = requestAnimationFrame((timestamp) =>
        applyScrollEffects(timestamp)
      )
    }

    const tryPlayVideos = () => {
      const forward = forwardVideoRef.current
      const reverse = reverseVideoRef.current
      if (!forward || !reverse) return

      forward.playbackRate = 1
      reverse.playbackRate = 1
      forward.play().catch(() => {})
      reverse.play().catch(() => {})
    }

    const forwardVideo = forwardVideoRef.current
    const reverseVideo = reverseVideoRef.current
    const handleForwardReady = () => {
      setForwardReady(true)
      tryPlayVideos()
    }
    const handleReverseReady = () => {
      setReverseReady(true)
      tryPlayVideos()
    }
    forwardVideo?.addEventListener('loadeddata', handleForwardReady)
    reverseVideo?.addEventListener('loadeddata', handleReverseReady)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pointerdown', tryPlayVideos, { passive: true })
    const startTs = performance.now()
    lastScrollTsRef.current = startTs
    lastMotionTsRef.current = startTs
    applyScrollEffects(startTs)
    tryPlayVideos()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pointerdown', tryPlayVideos)
      forwardVideo?.removeEventListener('loadeddata', handleForwardReady)
      reverseVideo?.removeEventListener('loadeddata', handleReverseReady)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (!page) {
    return null
  }

  return (
    <main className="fnaf4-page">
      <section className="fnaf4-hero" ref={sceneRef}>
        <div className="parallax-layer parallax-back" data-speed="0.05" />
        <div className="parallax-layer parallax-middle" data-speed="0.1" />
        <div className="parallax-layer parallax-front" data-speed="0.16" />

        <div className="hero-content" data-reveal="rise">
          <span className="hero-label">Issue #04 - Official Facts</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="hero-actions">
            <NavLink to="/home">Back to Home</NavLink>
            
          </div>
        </div>
      </section>

      <section className="facts-section" data-reveal="rise">
        <h2>Verified Information</h2>
        <div className="facts-grid">
          {page.facts.map((fact) => (
            <article className="fact-card" key={fact} data-reveal="slam">
              <p>{fact}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mechanics-section" data-reveal="rise">
        <div className="mechanic-column">
          <h3>Main Threats</h3>
          <ul>
            {page.threats.map((threat) => (
              <li key={threat}>{threat}</li>
            ))}
          </ul>
        </div>
        <div className="mechanic-column">
          <h3>Core Survival Loop</h3>
          <ul>
            {page.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lore-section" data-reveal="rise">
        <h2>FNAF 4 Lore Core</h2>
        <div className="lore-grid">
          {nightmareLore.map((line) => (
            <article className="lore-card" key={line} data-reveal="slam">
              <p>{line}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="jumpscare-scroll" className="scrub-section" ref={scrubRef}>
        <div className="scrub-sticky" data-reveal="ink">
          <div
            className={`scrub-media scrub-media-${scrollDirection}`}
            style={{ '--scrub-progress': scrubProgress }}
          >
            <img
              src={page.media.localWebp}
              alt="FNAF 4 Fredbear jumpscare fallback frame"
              className="scrub-fallback"
            />
            <video
              ref={forwardVideoRef}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              className={`scrub-video ${forwardReady ? 'is-ready' : ''} ${
                scrollDirection === 'down' ? 'is-active' : ''
              }`}
              poster={page.image}
            >
              <source src={page.media.localWebm} type="video/webm" />
            </video>
            <video
              ref={reverseVideoRef}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              className={`scrub-video ${reverseReady ? 'is-ready' : ''} ${
                scrollDirection === 'up' ? 'is-active' : ''
              }`}
              poster={page.image}
            >
              <source src={page.media.localWebmReverse} type="video/webm" />
            </video>
            <img
              src={page.media.localWebp}
              alt="FNAF 4 Fredbear jumpscare webp"
              className={`scrub-webp scrub-webp-${scrollDirection}`}
              style={{
                transform: `scale(${1 + scrubProgress * 0.26}) translateY(${
                  (0.5 - scrubProgress) * 22
                }px)`,
                filter: `contrast(${1 + scrubProgress * 0.7}) saturate(${
                  1 + scrubProgress * 0.25
                }) brightness(${0.9 + scrubProgress * 0.2})`,
                opacity:
                  (scrollDirection === 'down' && forwardReady) ||
                  (scrollDirection === 'up' && reverseReady)
                    ? 0
                    : 1,
              }}
            />
            <div className="scrub-overlay">
              <h2>Jumpscare Scroll Scrub</h2>
              <p>
                Scroll down to play forward. Scroll up to rewind. If idle, it
                pauses. Direction:{' '}
                <strong>
                  {scrollDirection === 'neutral'
                    ? 'PAUSED'
                    : scrollDirection === 'down'
                      ? 'FORWARD'
                      : 'REVERSE'}
                </strong>{' '}
                | Speed: <strong>{scrollRate.toFixed(2)}x</strong>
              </p>
              <p className="scare-text">
                {scareLines[Math.min(scareLines.length - 1, Math.floor(scrubProgress * scareLines.length))]}
              </p>
            </div>
          </div>
          <p className="asset-note">
            Loaded from <code>public/videos/fnaf4-fredbear-jump.webm</code> and{' '}
            <code>public/videos/fnaf4-fredbear-jump-reverse.webm</code> with WebP
            fallback.
          </p>
        </div>
      </section>

      <section className="sources-section" data-reveal="rise">
        <h3>Sources</h3>
        <ul>
          <li>
            <a href="https://store.steampowered.com/app/388090/Five_Nights_at_Freddys_4/">
              Steam - Five Nights at Freddy's 4
            </a>
          </li>
          <li>
            <a href="https://en.wikipedia.org/wiki/Five_Nights_at_Freddys_4">
              Wikipedia - Five Nights at Freddy's 4
            </a>
          </li>
        </ul>
      </section>
    </main>
  )
}

export default Fnaf4ComicPage
