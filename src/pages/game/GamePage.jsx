import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import PageHero from '../../components/page-hero/PageHero'
import { comicPages, getComicPage, getRelatedPages } from '../../data/comic-data'
import { useAuth } from '../../context/AuthContext'
import './GamePage.css'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function GamePage({ slug }) {
  const page = getComicPage(slug)
  const { currentUser, profile, addXp, markComicComplete } = useAuth()
  const readingRef = useRef({ seconds: 0 })
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
  const [forwardReady, setForwardReady] = useState(false)
  const [reverseReady, setReverseReady] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

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
    if (!currentUser) return undefined
    const interval = setInterval(() => {
      readingRef.current.seconds += 5
      addXp(2)
    }, 5000)

    return () => clearInterval(interval)
  }, [currentUser, addXp])

  useEffect(() => {
    setForwardReady(false)
    setReverseReady(false)
    setScrollDirection('neutral')
    setScrubProgress(0)
    activeDirectionRef.current = 'down'
    lastActiveTimeRef.current = 0
    lastScrollYRef.current = window.scrollY
    lastScrollTsRef.current = performance.now()
    lastMotionTsRef.current = performance.now()
    const forward = forwardVideoRef.current
    const reverse = reverseVideoRef.current
    if (forward) {
      forward.pause()
      forward.currentTime = 0
    }
    if (reverse) {
      reverse.pause()
      reverse.currentTime = 0
    }
  }, [slug])

  const shouldScrub =
    page?.category === 'FNAF' &&
    page?.media?.localWebm &&
    page?.media?.localWebmReverse

  useEffect(() => {
    if (!shouldScrub) return undefined

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

      if (scrubRef.current) {
        const sectionTop = scrubRef.current.offsetTop
        const sectionHeight = scrubRef.current.offsetHeight
        const start = sectionTop - window.innerHeight * 0.1
        const end = sectionTop + sectionHeight - window.innerHeight * 0.9
        const progress = clamp(
          (currentScrollY - start) / Math.max(end - start, 1),
          0,
          1
        )
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
      forwardVideo?.pause?.()
      reverseVideo?.pause?.()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [shouldScrub, slug])

  const handleComplete = async () => {
    if (!currentUser || isCompleting) return
    if (profile?.completedComics?.includes(slug)) return
    setIsCompleting(true)
    const completed = await markComicComplete(slug)
    if (completed) {
      await addXp(40)
    }
    setIsCompleting(false)
  }

  if (!page) {
    return (
      <main className="game-page">
        <section className="game-missing">
          <h1>Missing Page</h1>
          <p>This comic page is still in the sketchbook.</p>
          <NavLink to="/home">Return to Home</NavLink>
        </section>
      </main>
    )
  }

  const pageIndex = comicPages.findIndex((item) => item.slug === page.slug)
  const totalPages = comicPages.length
  const prevPage =
    pageIndex >= 0 ? comicPages[(pageIndex - 1 + totalPages) % totalPages] : null
  const nextPage =
    pageIndex >= 0 ? comicPages[(pageIndex + 1) % totalPages] : null

  const relatedPages = getRelatedPages(page.category, page.slug)
  const scareLines =
    page.scareLines ||
    page.threats?.map((threat) => `${threat} is close.`) || [
      'The hallway is getting louder.',
      'Do not blink.',
      'The shadows are inside the room.',
      'Every light flicker is a warning.',
    ]
  const fallbackImage = page.media?.localWebp || page.image

  return (
    <main className="game-page">
      <PageHero
        title={page.title}
        subtitle={page.subtitle}
        image={page.image}
        imagePosition={page.imagePosition}
        issue={page.issue}
        location={page.location}
        badge={page.comingSoon ? 'Coming soon' : ''}
      />

      <section className="game-summary" data-reveal="rise">
        <p>{page.description}</p>
      </section>

      {page.comingSoon ? (
        <section className="coming-soon" data-reveal="rise">
          <div className="coming-soon-inner">
            <span>Coming soon</span>
            <p>The full issue is still in production, but the preview panels are live.</p>
          </div>
        </section>
      ) : null}

      <section className="game-panels">
        <article className="panel-card" data-reveal="slam">
          <h3>Threat Lineup</h3>
          <ul>
            {page.threats.map((threat) => (
              <li key={threat}>{threat}</li>
            ))}
          </ul>
        </article>
        <article className="panel-card" data-reveal="slam">
          <h3>Survival Notes</h3>
          <ul>
            {page.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </article>
        <article className="panel-card" data-reveal="slam">
          <h3>Signature Moment</h3>
          <p>
            The lights fail inside {page.location}. Every hallway sketch bleeds
            into the next panel as the horror closes in.
          </p>
        </article>
      </section>

      {shouldScrub ? (
        <section className="scrub-section" ref={scrubRef}>
          <div className="scrub-sticky" data-reveal="ink">
            <div
              className={`scrub-media scrub-media-${scrollDirection}`}
              style={{ '--scrub-progress': scrubProgress }}
            >
              <video
                ref={forwardVideoRef}
                muted
                playsInline
                loop
                autoPlay
                preload="metadata"
                key={`${page.slug}-forward`}
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
                key={`${page.slug}-reverse`}
                className={`scrub-video ${reverseReady ? 'is-ready' : ''} ${
                  scrollDirection === 'up' ? 'is-active' : ''
                }`}
                poster={page.image}
              >
                <source src={page.media.localWebmReverse} type="video/webm" />
              </video>
              <img
                src={fallbackImage}
                alt={`${page.title} jumpscare webp`}
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
                <h2>Nightmare Frame</h2>
                <p>{page.subtitle}</p>
                <p className="scare-text">
                  {
                    scareLines[
                      Math.min(
                        scareLines.length - 1,
                        Math.floor(scrubProgress * scareLines.length)
                      )
                    ]
                  }
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="complete-section" data-reveal="rise">
        <div>
          <h3>Chapter Complete</h3>
          <p>Claim XP and unlock achievements once you've finished the issue.</p>
        </div>
        <button
          type="button"
          onClick={handleComplete}
          disabled={
            !currentUser ||
            isCompleting ||
            profile?.completedComics?.includes(slug)
          }
        >
          {!currentUser
            ? 'Log in to earn XP'
            : profile?.completedComics?.includes(slug)
              ? 'Completed'
              : isCompleting
                ? 'Saving...'
                : 'Mark as completed (+40 XP)'}
        </button>
      </section>

      <section className="game-footer" data-reveal="rise">
        <NavLink to="/home">Back to Comic Index</NavLink>
        <div className="comic-nav">
          {prevPage ? (
            <NavLink className="comic-nav-link" to={`/games/${prevPage.slug}`}>
              <span>Previous</span>
              <strong>{prevPage.title}</strong>
            </NavLink>
          ) : null}
          {nextPage ? (
            <NavLink className="comic-nav-link" to={`/games/${nextPage.slug}`}>
              <span>Next</span>
              <strong>{nextPage.title}</strong>
            </NavLink>
          ) : null}
        </div>
        {relatedPages.length > 0 ? (
          <div className="related-list">
            <span>More in this arc:</span>
            <div>
              {relatedPages.slice(0, 3).map((item) => (
                <NavLink key={item.slug} to={`/games/${item.slug}`}>
                  {item.title}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default GamePage
