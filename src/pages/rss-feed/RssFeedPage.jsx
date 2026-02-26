import { useEffect, useState } from 'react'
import './RssFeedPage.css'

function RssFeedPage() {
  const feedSources = [
    {
      id: 'commits',
      title: 'Project commits',
      description: 'Every push to the Dark Realm codebase.',
      url: 'https://github.com/partybearcode/partybear-dark-realm/commits/main.atom',
    },
  ]

  const [feeds, setFeeds] = useState(() =>
    feedSources.reduce(
      (acc, feed) => ({
        ...acc,
        [feed.id]: { status: 'loading', items: [], error: '' },
      }),
      {}
    )
  )

  useEffect(() => {
    let isMounted = true

    const fetchFeed = async (feed) => {
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
          feed.url
        )}`
        const response = await fetch(proxyUrl)
        if (!response.ok) {
          throw new Error('Feed response failed.')
        }
        const text = await response.text()
        const doc = new DOMParser().parseFromString(text, 'application/xml')
        const entries = Array.from(doc.querySelectorAll('entry')).slice(0, 5)
        const items = entries.map((entry) => ({
          title: entry.querySelector('title')?.textContent?.trim() || 'Update',
          link: entry.querySelector('link')?.getAttribute('href') || '',
          date: entry.querySelector('updated')?.textContent || '',
        }))
        if (isMounted) {
          setFeeds((prev) => ({
            ...prev,
            [feed.id]:
              items.length > 0
                ? { status: 'success', items, error: '' }
                : {
                    status: 'empty',
                    items: [],
                    error: 'No items yet for this feed.',
                  },
          }))
        }
      } catch (error) {
        if (isMounted) {
          setFeeds((prev) => ({
            ...prev,
            [feed.id]: {
              status: 'error',
              items: [],
              error:
                'Feed unavailable. The RSS proxy blocked this request. Use the RSS link below.',
            },
          }))
        }
      }
    }

    feedSources.forEach((feed) => {
      fetchFeed(feed)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const formatDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.valueOf())) return ''
    return date.toLocaleDateString()
  }

  return (
    <main className="rss-page">
      <section className="rss-hero">
        <span className="rss-tag">RSS Channel</span>
        <h1>Dark Realm Update Feed</h1>
        <p>
          Track real updates tied to the project. This feed follows every commit
          published to the Dark Realm repository.
        </p>
        <div className="rss-links">
          {feedSources.map((feed) => (
            <a
              key={feed.id}
              className="rss-link"
              href={feed.url}
              target="_blank"
              rel="noreferrer"
            >
              {feed.title} RSS
            </a>
          ))}
        </div>
      </section>

      <section className="rss-panels">
        {feedSources.map((feed) => {
          const feedState = feeds[feed.id] || { status: 'loading', items: [] }
          return (
            <article key={feed.id} className="rss-panel">
              <div className="rss-panel-header">
                <h2>{feed.title}</h2>
                <p>{feed.description}</p>
              </div>
              {feedState.status === 'loading' ? (
                <div className="rss-status">Loading feed...</div>
              ) : null}
              {feedState.status === 'error' ? (
                <div className="rss-status">{feedState.error}</div>
              ) : null}
              {feedState.status === 'empty' ? (
                <div className="rss-status">{feedState.error}</div>
              ) : null}
              {feedState.status === 'success' ? (
                <ul className="rss-list">
                  {feedState.items.map((item) => (
                    <li key={item.link || item.title} className="rss-item">
                      <a href={item.link} target="_blank" rel="noreferrer">
                        {item.title}
                      </a>
                      {item.date ? (
                        <span>{formatDate(item.date)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          )
        })}
      </section>
    </main>
  )
}

export default RssFeedPage
