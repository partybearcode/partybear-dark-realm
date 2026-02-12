import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import ThreeScene from '../../components/three-scene/ThreeScene'
import GameCard from '../../components/game-card/GameCard'
import { comicPages, homeSections } from '../../data/comicData'
import './Home.css'

function Home() {
  const vaultArcadeGames = [
    {
      title: 'Ghost Tap',
      description: 'Tap the glowing tile before it disappears from the grid.',
      tag: 'Reflex hunt',
      link: '/arcade',
      image: '/images/ghost-tap.webp',
    },
    {
      title: 'Signal Decode',
      description: 'Repeat the flashing sequence and survive the broadcast.',
      tag: 'Memory lock',
      link: '/arcade',
      image: '/images/signal-decode.webp',
    },
    {
      title: 'Night Watch',
      description: 'Hold the meter inside the safe zone for 20 seconds.',
      tag: 'Focus trial',
      link: '/arcade',
      image: '/images/night-watch.webp',
    },
    {
      title: 'Phantom Arcade',
      description: 'Enter the cabinet floor and claim XP from every challenge.',
      tag: 'Arcade hub',
      link: '/arcade',
      image: '/images/memory-game.webp',
    },
  ]

  const vaultComicSlugs = [
    'fnaf-help-wanted',
    'fnaf-help-wanted-2',
    'fnaf-security-breach',
    'security-breach-ruin',
    'fnaf-secret-of-the-mimic',
  ]

  const vaultComicGames = comicPages.filter((page) =>
    vaultComicSlugs.includes(page.slug)
  )

  const loreTimeline = [
    {
      year: '1983',
      title: 'The Bite',
      description: 'The night shifts fracture, and the bedroom becomes a loop.',
    },
    {
      year: '1987',
      title: 'Echo Sightings',
      description: 'Nightmares leak into day shifts through corrupted tapes.',
    },
    {
      year: '1993',
      title: 'Shutdown Signal',
      description: 'Every animatronic logs a new shadow protocol.',
    },
    {
      year: 'Now',
      title: 'Dark Realm',
      description: 'Readers become witnesses and the archive fights back.',
    },
  ]

  const realmHighlights = [
    {
      title: 'Definitive Horror Hub',
      description:
        "Party Bear's Dark Realm is the definitive page for horror fans: a curated archive of comics, games, and dark lore.",
    },
    {
      title: 'Comic-First Storytelling',
      description:
        'Every entry reads like a graphic issue, with signature moments, threats, and survival notes.',
    },
    {
      title: 'Interactive XP Archive',
      description:
        'Progress through the arcade, earn XP, and track achievements tied to every chapter.',
    },
  ]

  const realmManifest = [
    {
      title: 'Built for Night Shift Fans',
      description:
        'If you love late-night horror, animatronics, and cursed stadium legends, this is your home base.',
    },
    {
      title: 'Stories That Interlock',
      description:
        'FNAF, Bear Alpha, and the soccer nightmares all connect through shared lore drops and recurring symbols.',
    },
    {
      title: 'Always Expanding',
      description:
        'New comics, new videos, and new arcade challenges keep the realm alive.',
    },
  ]

  const realmStats = [
    {
      label: 'Comics in the Archive',
      value: `${comicPages.length}+`,
      detail: 'Every issue logged with threats, tips, and lore.',
    },
    {
      label: 'Arcade Challenges',
      value: '4',
      detail: 'Reflex, memory, and survival trials that feed XP.',
    },
    {
      label: 'Lore Signals',
      value: '12',
      detail: 'Hidden notes that connect the universes together.',
    },
  ]

  const storySlices = [
    {
      tag: 'FNAF Signal',
      title: 'Night Shift Dispatch',
      description:
        'Camera feeds, audio checks, and flashlight flickers drive the FNAF chapters. Every scroll lock mirrors a real panic moment.',
      image: comicPages.find((page) => page.slug === 'fnaf-4')?.image,
      imagePosition: comicPages.find((page) => page.slug === 'fnaf-4')
        ?.imagePosition,
      link: '/games/fnaf-4',
    },
    {
      tag: 'Bear Alpha',
      title: 'Alpha Den Files',
      description:
        'Bear Alpha stories bring stadium horror, crimson floods, and broken playbooks. This arc is a slow-burn comic special.',
      image: comicPages.find((page) => page.slug === 'bear-alpha')?.image,
      imagePosition: comicPages.find((page) => page.slug === 'bear-alpha')
        ?.imagePosition,
      link: '/games/bear-alpha',
    },
    {
      tag: 'Soccer Nightmares',
      title: 'Stadium Hauntings',
      description:
        'Mbappe and Vini Jr nightmare issues fuse football and fear. Expect cursed chants, warped tunnels, and corrupted floodlights.',
      image: comicPages.find((page) => page.slug === 'kylian-mbappe-nightmare')
        ?.image,
      imagePosition: comicPages.find(
        (page) => page.slug === 'kylian-mbappe-nightmare'
      )?.imagePosition,
      link: '/games/kylian-mbappe-nightmare',
    },
  ]
  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]')
    const impactItems = document.querySelectorAll('[data-impact]')
    const parallaxItems = document.querySelectorAll('[data-parallax]')
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const isSmallScreen = window.matchMedia('(max-width: 720px)').matches

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    )

    const impactObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('impact-visible')
          }
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -12% 0px' }
    )

    revealItems.forEach((item) => revealObserver.observe(item))
    impactItems.forEach((item) => impactObserver.observe(item))

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'))
      impactItems.forEach((item) => item.classList.add('impact-visible'))
    }

    let animationFrame
    const handleScroll = () => {
      if (animationFrame) return
      animationFrame = requestAnimationFrame(() => {
        const scrollY = window.scrollY
        parallaxItems.forEach((item) => {
          const depth = Number(item.dataset.parallax || 0)
          const offset = (scrollY - item.offsetTop + window.innerHeight * 0.6) * depth
          item.style.transform = `translate3d(0, ${offset}px, 0)`
        })
        animationFrame = null
      })
    }

    if (!prefersReducedMotion && !isSmallScreen) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
    }

    return () => {
      revealItems.forEach((item) => revealObserver.unobserve(item))
      impactItems.forEach((item) => impactObserver.unobserve(item))
      window.removeEventListener('scroll', handleScroll)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <main className="home">
      <section className="hero" data-impact>
        <div className="hero-copy" data-reveal="rise">
          <span className="hero-tag">Comic Horror Archive</span>
          <h1>
            PartyBear's Dark Realm: a blood ink tour through every nightmare
            chapter.
          </h1>
          <p>
            Party Bear's Dark Realm is the definitive page for horror fans. Use
            the archive below to jump into every comic issue, crossover, and
            interactive nightmare.
          </p>
          <div className="hero-callouts">
            <span>FNAF Saga</span>
            <span>Bear Alpha Files</span>
            <span>Soccer Nightmares</span>
          </div>
          <div className="hero-bubble" data-reveal="slam">
            "Don't blink. The panel bites back."
          </div>
        </div>
        <div className="hero-scene" data-reveal="ink">
          <div className="hero-parallax" data-parallax="0.12">
            <ThreeScene />
            <div className="hero-splat" />
          </div>
        </div>
      </section>

      <section className="comic-alert" data-impact>
        <div className="comic-alert-inner" data-reveal="slam">
          <h2>Scroll. The panels slam into place.</h2>
          <p>
            Each section explodes in with comic motion, ink splashes, and
            high-contrast horror panels.
          </p>
        </div>
      </section>

      <section className="highlight-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Why the Dark Realm Exists</h2>
          <p>One place to archive every scare, scream, and survival story.</p>
        </div>
        <div className="highlight-grid">
          {realmHighlights.map((item) => (
            <article key={item.title} className="highlight-card" data-reveal="slam">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stats-strip" data-impact>
        <div className="stats-grid">
          {realmStats.map((stat) => (
            <article key={stat.label} className="stat-panel" data-reveal="slam">
              <span className="stat-label">{stat.label}</span>
              <strong className="stat-value">{stat.value}</strong>
              <p>{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="slice-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Inside the Archive</h2>
          <p>Three paths. Three horror moods. Every path is live.</p>
        </div>
        <div className="slice-grid">
          {storySlices.map((slice, index) => (
            <article
              key={slice.title}
              className={`slice-row ${index % 2 === 1 ? 'is-reverse' : ''}`}
              data-reveal="slam"
            >
              <div className="slice-copy">
                <span className="slice-tag">{slice.tag}</span>
                <h3>{slice.title}</h3>
                <p>{slice.description}</p>
                <NavLink className="slice-link" to={slice.link}>
                  Open chapter
                </NavLink>
              </div>
              <div
                className="slice-media"
                style={{
                  backgroundImage: `url(${slice.image})`,
                  backgroundPosition: slice.imagePosition || 'center',
                }}
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      </section>

      <section className="tone-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Realm Tone</h2>
          <p>Set the vibe before diving into the comic archive.</p>
        </div>
        <div className="tone-grid">
          <article className="tone-card" data-reveal="slam">
            <h3>Blood Ink Panels</h3>
            <p>High-contrast frames, thick outlines, and ink splashes.</p>
          </article>
          <article className="tone-card" data-reveal="slam">
            <h3>Audio-Driven Fear</h3>
            <p>FNAF 4 style: every click and breath matters.</p>
          </article>
          <article className="tone-card" data-reveal="slam">
            <h3>Nightmare Lore</h3>
            <p>1983 memories, the bite, and the haunting bedroom loop.</p>
          </article>
        </div>
      </section>

      <section className="signal-section" data-impact>
        <div className="signal-panel" data-reveal="slam">
          <h2>Signal Transmission</h2>
          <p>
            You are not just entering a comic. You are stepping into a signal
            that corrupts memory and bends the night into a loop.
          </p>
        </div>
      </section>

      <section className="manifest-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Realm Manifest</h2>
          <p>The promises that keep this archive alive.</p>
        </div>
        <div className="manifest-grid">
          {realmManifest.map((item) => (
            <article key={item.title} className="manifest-card" data-reveal="slam">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="timeline-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Lore Timeline</h2>
          <p>Key fractures that shaped the Dark Realm archive.</p>
        </div>
        <div className="timeline-grid">
          {loreTimeline.map((item) => (
            <article key={item.year} className="timeline-card" data-reveal="slam">
              <span>{item.year}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {homeSections.map((section, index) => {
        const sectionPages = comicPages.filter(
          (page) => page.category === section.category
        )
        const layoutClass =
          sectionPages.length < 3
            ? 'card-grid--compact'
            : index % 2 === 0
              ? 'card-grid--wide'
              : 'card-grid--tall'

        return (
          <section key={section.id} className="comic-section" data-impact>
            <div className="section-header" data-reveal="rise">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <div className={`card-grid ${layoutClass}`}>
              {sectionPages.map((page) => (
                <GameCard key={page.slug} {...page} />
              ))}
            </div>
          </section>
        )
      })}

      <section className="experience-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Experience</h2>
          <p>How to survive the Dark Realm once you choose a page.</p>
        </div>
        <div className="experience-grid">
          <article className="experience-card" data-reveal="slam">
            <h3>Choose a Path</h3>
            <p>Each issue is a self-contained nightmare with its own rules.</p>
          </article>
          <article className="experience-card" data-reveal="slam">
            <h3>Follow the Scroll</h3>
            <p>Scroll-locked moments reveal jumpscares, lore, and secrets.</p>
          </article>
          <article className="experience-card" data-reveal="slam">
            <h3>Return Alive</h3>
            <p>Every page links back to the archive for the next chapter.</p>
          </article>
        </div>
      </section>

      <section className="games-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Games Vault</h2>
          <p>Original mini-stories that expand the Dark Realm beyond the comics.</p>
        </div>
        <div className="vault-subtitle" data-reveal="rise">
          <h3>Arcade Challenges</h3>
          <p>Playable mini-games that feed XP and achievements.</p>
        </div>
        <div className="games-grid">
          {vaultArcadeGames.map((game) => (
            <article key={game.title} className="game-tile" data-reveal="slam">
              <div
                className="game-thumb"
                style={{ backgroundImage: `url(${game.image})` }}
                aria-hidden="true"
              />
              <div className="game-body">
                <span>{game.tag}</span>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <NavLink className="game-link" to={game.link}>
                  Open file
                </NavLink>
              </div>
            </article>
          ))}
        </div>
        <div className="games-cta" data-reveal="slam">
          <NavLink to="/arcade" className="games-cta-button">
            Enter the Phantom Arcade
          </NavLink>
        </div>
        <div className="vault-subtitle" data-reveal="rise">
          <h3>Missing Files</h3>
          <p>Late-night entries that deserve their own spotlight.</p>
        </div>
        <div className="card-grid">
          {vaultComicGames.map((page) => (
            <GameCard key={page.slug} {...page} />
          ))}
        </div>
      </section>

      <section className="ritual-section" data-impact>
        <div className="section-header" data-reveal="rise">
          <h2>Reader Rituals</h2>
          <p>Small rules that keep you alive inside the panels.</p>
        </div>
        <div className="ritual-grid">
          <article className="ritual-card" data-reveal="slam">
            <h3>Listen First</h3>
            <p>Every sound cue hints at where the next scare lands.</p>
          </article>
          <article className="ritual-card" data-reveal="slam">
            <h3>Track the Shadows</h3>
            <p>Movement in the margins means a new chapter is opening.</p>
          </article>
          <article className="ritual-card" data-reveal="slam">
            <h3>Bank Your XP</h3>
            <p>Arcade wins add XP and achievements to your global record.</p>
          </article>
        </div>
      </section>

      <section className="final-panel" data-impact>
        <div className="final-panel-inner" data-reveal="slam">
          <h2>Pick a page. Survive the issue.</h2>
          <p>
            Every page delivers a blood-stained comic layout with threats,
            locations, and survival notes.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Home
