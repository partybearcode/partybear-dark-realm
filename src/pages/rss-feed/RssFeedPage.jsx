import { useEffect, useState } from 'react'
import './RssFeedPage.css'

function RssFeedPage() {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://users-partybear-dark-realm.web.app'
  const feedSources = [
    {
      id: 'dark-realm',
      title: 'Dark Realm Updates',
      description: 'Comic drops, arcade updates, and lore transmissions.',
      url: `${baseUrl}/rss-dark-realm.xml`,
    },
    {
      id: 'commits',
      title: 'Project Commits (GitHub)',
      description: 'Every push to the Dark Realm codebase.',
      url: `${baseUrl}/rss-file`,
      sourceUrl:
        'https://github.com/partybearcode/partybear-dark-realm/commits/main.atom',
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

    const parseXmlFeed = (text) => {
      const doc = new DOMParser().parseFromString(text, 'application/xml')
      const rssItems = Array.from(doc.querySelectorAll('item')).slice(0, 5)
      const atomEntries = Array.from(doc.querySelectorAll('entry')).slice(0, 5)
      const items = (rssItems.length ? rssItems : atomEntries).map((entry) => {
        if (entry.tagName.toLowerCase() === 'item') {
          return {
            title: entry.querySelector('title')?.textContent?.trim() || 'Update',
            link: entry.querySelector('link')?.textContent || '',
            date: entry.querySelector('pubDate')?.textContent || '',
          }
        }
        return {
          title: entry.querySelector('title')?.textContent?.trim() || 'Update',
          link: entry.querySelector('link')?.getAttribute('href') || '',
          date: entry.querySelector('updated')?.textContent || '',
        }
      })
      return items
    }

    const fetchFeed = async (feed) => {
      try {
        let items = []
        const xmlTargets = []
        const isLocal = baseUrl.includes('localhost')

        if (feed.id === 'commits') {
          if (feed.sourceUrl) {
            xmlTargets.push(
              `https://api.allorigins.win/raw?url=${encodeURIComponent(
                feed.sourceUrl
              )}`
            )
            xmlTargets.push(
              `https://r.jina.ai/http://github.com/partybearcode/partybear-dark-realm/commits/main.atom`
            )
          }
          if (!isLocal) {
            xmlTargets.push(feed.url)
          }
        } else {
          xmlTargets.push(feed.url)
        }

        for (const target of xmlTargets) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const response = await fetch(target)
            if (!response.ok) continue
            // eslint-disable-next-line no-await-in-loop
            const text = await response.text()
            const parsed = parseXmlFeed(text)
            if (parsed.length) {
              items = parsed
              break
            }
          } catch (fetchError) {
            // Keep trying fallbacks on network/CORS errors.
          }
        }

        if (!items.length && feed.api) {
          const apiResponse = await fetch(feed.api)
          if (apiResponse.ok) {
            const data = await apiResponse.json()
            items = data.slice(0, 5).map((entry) => ({
              title:
                entry.commit?.message?.split('\n')[0] ||
                entry.commit?.message ||
                'Update',
              link: entry.html_url || '',
              date: entry.commit?.author?.date || '',
            }))
          }
        }

        if (!items.length) {
          throw new Error('Feed response failed.')
        }

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
        if (isMounted) {
          setFeeds((prev) => ({
            ...prev,
            [feed.id]: {
              status: 'error',
              items: [],
              error:
                feed.id === 'commits'
                  ? 'Commit feed unavailable. Check the /rss-file redirect or GitHub feed.'
                  : 'Feed unavailable. Make sure the RSS file is deployed.',
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
          Track real updates tied to the project. Subscribe to the Dark Realm
          updates or follow the live commit feed.
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
        <div className="rss-links">
          {feedSources.map((feed) => (
            <div key={`${feed.id}-copy`} className="rss-link rss-copy">
              <span>Copy feed URL:</span>
              <code>{feed.url}</code>
            </div>
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
