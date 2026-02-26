import { useEffect, useState } from 'react'
import './RssFeedPage.css'

function RssFeedPage() {
  const feedSources = [
    {
      id: 'commits',
      title: 'Project commits',
      description: 'Every push to the Dark Realm codebase.',
      url: 'https://github.com/partybearcode/partybear-dark-realm/commits/main.atom',
      api: 'https://api.github.com/repos/partybearcode/partybear-dark-realm/commits?per_page=5',
    },
  ]

  const [feeds, setFeeds] = useState(() =>
    feedSources.reduce(
      (acc, feed) => ({
        ...acc,
        [feed.id]: { status: 'loading', items: [], error: '', note: '' },
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
                ? { status: 'success', items, error: '', note: '' }
                : {
                    status: 'empty',
                    items: [],
                    error: 'No items yet for this feed.',
                    note: '',
                  },
          }))
        }
      } catch (error) {
        if (feed.api) {
          try {
            const response = await fetch(feed.api)
            if (!response.ok) {
              throw new Error('API response failed.')
            }
            const data = await response.json()
            const items = data.slice(0, 5).map((entry) => ({
              title:
                entry.commit?.message?.split('\n')[0] ||
                entry.commit?.message ||
                'Update',
              link: entry.html_url || '',
              date: entry.commit?.author?.date || '',
            }))
            if (isMounted) {
              setFeeds((prev) => ({
                ...prev,
                [feed.id]: {
                  status: items.length ? 'success' : 'empty',
                  items,
                  error: items.length ? '' : 'No items yet for this feed.',
                  note: 'Loaded via GitHub API fallback.',
                },
              }))
            }
            return
          } catch (apiError) {
            // fall through to error display
          }
        }
        if (isMounted) {
          setFeeds((prev) => ({
            ...prev,
            [feed.id]: {
              status: 'error',
              items: [],
              error:
                'Feed unavailable. The RSS proxy blocked this request. Use the RSS link below.',
              note: '',
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
          const feedState = feeds[feed.id] || {
            status: 'loading',
            items: [],
            note: '',
          }
          return (
            <article key={feed.id} className="rss-panel">
              <div className="rss-panel-header">
                <h2>{feed.title}</h2>
                <p>{feed.description}</p>
              </div>
              {feedState.note ? (
                <div className="rss-note">{feedState.note}</div>
              ) : null}
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
