import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink } from 'react-router-dom'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import './AdminLogsPage.css'

const logCategories = [
  { id: 'all', label: 'All Runs' },
  { id: 'Ghost Tap', label: 'Ghost Tap' },
  { id: 'Signal Decode', label: 'Signal Decode' },
  { id: 'Night Watch', label: 'Night Watch' },
  { id: 'Memory Match', label: 'Memory Match' },
  { id: 'Reaction Test', label: 'Reaction Test' },
  { id: 'Shadow Runner', label: 'Shadow Runner' },
]

const PAGE_SIZE = 20

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function AdminLogsPage() {
  const { currentUser, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState([])
  const [cursors, setCursors] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({
    scoreLabel: '',
    scoreValue: '',
    xp: '',
    note: '',
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const canPrev = page > 0
  const canNext =
    (pages[page + 1] && pages[page + 1].length > 0) || hasMore

  useEffect(() => {
    setPages([])
    setCursors([])
    setPage(0)
    setLogs([])
    setHasMore(false)
    setStatus('loading')
    setError('')
    setEditingId(null)
    setConfirmDeleteId(null)
  }, [category])

  useEffect(() => {
    let isMounted = true
    const loadLogs = async () => {
      if (pages[page]) {
        setLogs(pages[page])
        setStatus(pages[page].length ? 'success' : 'empty')
        return
      }

      setStatus('loading')
      try {
        const logsRef = collection(db, 'arcade_logs')
        const cursor = page > 0 ? cursors[page - 1] : null
        const baseQuery = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)]
        const logsQuery =
          category !== 'all'
            ? cursor
              ? query(
                  logsRef,
                  where('category', '==', category),
                  orderBy('createdAt', 'desc'),
                  startAfter(cursor),
                  limit(PAGE_SIZE)
                )
              : query(logsRef, where('category', '==', category), ...baseQuery)
            : cursor
              ? query(
                  logsRef,
                  orderBy('createdAt', 'desc'),
                  startAfter(cursor),
                  limit(PAGE_SIZE)
                )
              : query(logsRef, ...baseQuery)

        const snapshot = await getDocs(logsQuery)
        const nextLogs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null

        if (isMounted) {
          setPages((prev) => {
            const next = [...prev]
            next[page] = nextLogs
            return next
          })
          setCursors((prev) => {
            const next = [...prev]
            next[page] = lastDoc
            return next
          })
          setLogs(nextLogs)
          setHasMore(snapshot.docs.length === PAGE_SIZE)
          setStatus(nextLogs.length ? 'success' : 'empty')
          setError('')
        }
      } catch (err) {
        if (!isMounted) return
        const message = String(err?.message || '')
        let nextError =
          'Arcade logs are offline. Check your Firebase rules or connection.'
        if (err?.code === 'failed-precondition' || message.includes('index')) {
          nextError =
            'Missing Firestore index for arcade_logs. Create a composite index: category (ASC) + createdAt (DESC).'
        } else if (err?.code === 'permission-denied') {
          nextError = 'Permission denied. Admin rules are required.'
        }
        setError(nextError)
        setStatus('error')
      }
    }

    loadLogs()

    return () => {
      isMounted = false
    }
  }, [category, page, pages, cursors])

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return logs
    return logs.filter((log) => {
      const haystack = [
        log.gameName,
        log.player,
        log.category,
        log.note,
        log.scoreLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [logs, search])

  const beginEdit = (log) => {
    setEditingId(log.id)
    setDraft({
      scoreLabel: log.scoreLabel || 'Score',
      scoreValue:
        typeof log.scoreValue === 'number'
          ? log.scoreValue
          : typeof log.score === 'number'
            ? log.score
            : '',
      xp: typeof log.xp === 'number' ? log.xp : '',
      note: log.note || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft({ scoreLabel: '', scoreValue: '', xp: '', note: '' })
  }

  const updateStoredLog = (logId, payload) => {
    setLogs((prev) =>
      prev.map((item) => (item.id === logId ? { ...item, ...payload } : item))
    )
    setPages((prev) =>
      prev.map((pageLogs, index) =>
        index === page
          ? pageLogs.map((item) =>
              item.id === logId ? { ...item, ...payload } : item
            )
          : pageLogs
      )
    )
  }

  const removeStoredLog = (logId) => {
    setLogs((prev) => prev.filter((item) => item.id !== logId))
    setPages((prev) =>
      prev.map((pageLogs, index) =>
        index === page
          ? pageLogs.filter((item) => item.id !== logId)
          : pageLogs
      )
    )
  }

  const handleSave = async (log) => {
    if (busyId) return
    setBusyId(log.id)
    try {
      const nextScoreLabel = draft.scoreLabel?.trim() || log.scoreLabel || 'Score'
      const nextScoreValue =
        toNumber(draft.scoreValue) ??
        (typeof log.scoreValue === 'number'
          ? log.scoreValue
          : typeof log.score === 'number'
            ? log.score
            : null)
      const nextXp =
        toNumber(draft.xp) ?? (typeof log.xp === 'number' ? log.xp : null)
      const nextNote = draft.note?.trim() || ''
      const payload = {
        scoreLabel: nextScoreLabel,
        scoreValue: nextScoreValue,
        score: nextScoreValue,
        xp: nextXp,
        note: nextNote,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(doc(db, 'arcade_logs', log.id), payload)
      updateStoredLog(log.id, payload)
      cancelEdit()
    } catch (err) {
      setError(err?.message || 'Failed to update log.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (logId) => {
    if (busyId) return
    setBusyId(logId)
    try {
      await deleteDoc(doc(db, 'arcade_logs', logId))
      removeStoredLog(logId)
      if (confirmDeleteId === logId) setConfirmDeleteId(null)
    } catch (err) {
      setError(err?.message || 'Failed to delete log.')
    } finally {
      setBusyId(null)
    }
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />
  }

  if (!profile) {
    return (
      <main className="admin-logs-page">
        <section className="admin-logs-card">
          <h1>Admin Logs</h1>
          <p>Loading admin access...</p>
        </section>
      </main>
    )
  }

  if (!profile.isAdmin) {
    return (
      <main className="admin-logs-page">
        <section className="admin-logs-card">
          <h1>Admin Logs</h1>
          <p>Access denied. Admin permissions are required.</p>
          <NavLink className="admin-back" to="/home">
            Back to Home
          </NavLink>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-logs-page">
      <section className="admin-logs-card">
        <div className="admin-logs-header">
          <div>
            <h1>Arcade Logs Admin</h1>
            <p>Manage scores, XP, and notes from Firebase.</p>
          </div>
          <span className="admin-logs-count">{logs.length} logs loaded</span>
        </div>

        <div className="admin-logs-controls">
          <div className="admin-search">
            <label htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              type="search"
              value={search}
              placeholder="Search player, cabinet, or note..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="admin-category">
            {logCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-chip ${category === item.id ? 'is-active' : ''}`}
                onClick={() => setCategory(item.id)}
                aria-pressed={category === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {status === 'loading' ? (
          <div className="admin-status">Loading logs...</div>
        ) : null}
        {status === 'error' ? (
          <div className="admin-status">{error}</div>
        ) : null}
        {status === 'empty' ? (
          <div className="admin-status">
            No logs yet. Play a game to generate a run.
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="admin-log-grid">
            {filteredLogs.map((log) => {
              const logDate =
                log.createdAt?.toDate?.() ||
                (log.createdAt ? new Date(log.createdAt) : null)
              const dateLabel =
                logDate && !Number.isNaN(logDate.valueOf())
                  ? logDate.toLocaleString()
                  : ''
              const isEditing = editingId === log.id
              const scoreValue =
                typeof log.scoreValue === 'number'
                  ? log.scoreValue
                  : typeof log.score === 'number'
                    ? log.score
                    : null
              return (
                <article key={log.id} className="admin-log-card">
                  <div className="admin-log-header">
                    <div>
                      <h3>{log.gameName || 'Arcade Run'}</h3>
                      <span className="admin-log-category">
                        {log.category || 'Unsorted'}
                      </span>
                    </div>
                    {dateLabel ? <span className="admin-log-date">{dateLabel}</span> : null}
                  </div>

                  {!isEditing ? (
                    <div className="admin-log-meta">
                      <span>
                        {log.scoreLabel || 'Score'}:{' '}
                        <strong>
                          {scoreValue ?? '—'}
                          {scoreValue !== null && log.scoreUnit ? ` ${log.scoreUnit}` : ''}
                        </strong>
                      </span>
                      <span>
                        XP <strong>{log.xp ?? '—'}</strong>
                      </span>
                    </div>
                  ) : null}

                  {!isEditing && log.player ? (
                    <p className="admin-log-player">Player: {log.player}</p>
                  ) : null}
                  {!isEditing && log.note ? (
                    <p className="admin-log-note">{log.note}</p>
                  ) : null}

                  {isEditing ? (
                    <div className="admin-edit-grid">
                      <label>
                        Score label
                        <input
                          value={draft.scoreLabel}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              scoreLabel: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Score value
                        <input
                          type="number"
                          value={draft.scoreValue}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              scoreValue: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        XP
                        <input
                          type="number"
                          value={draft.xp}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              xp: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="admin-note">
                        Note
                        <textarea
                          rows="3"
                          value={draft.note}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              note: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="admin-log-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="admin-save"
                          disabled={busyId === log.id}
                          onClick={() => handleSave(log)}
                        >
                          {busyId === log.id ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="admin-cancel" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => beginEdit(log)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-delete"
                          onClick={() =>
                            setConfirmDeleteId((prev) => (prev === log.id ? null : log.id))
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {confirmDeleteId === log.id ? (
                    <div className="admin-delete-confirm">
                      <p>Delete this log? This cannot be undone.</p>
                      <div className="admin-delete-actions">
                        <button
                          type="button"
                          className="admin-delete"
                          disabled={busyId === log.id}
                          onClick={() => handleDelete(log.id)}
                        >
                          {busyId === log.id ? 'Deleting...' : 'Confirm delete'}
                        </button>
                        <button
                          type="button"
                          className="admin-cancel"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : null}

        <div className="admin-pagination">
          <button
            type="button"
            className="admin-page-button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={!canPrev || status === 'loading'}
          >
            Prev
          </button>
          <span className="admin-page-indicator">Page {page + 1}</span>
          <button
            type="button"
            className="admin-page-button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!canNext || status === 'loading'}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  )
}

export default AdminLogsPage
