import { useEffect, useState } from 'react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { FaBolt, FaBook, FaTrophy } from 'react-icons/fa6'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../services/firebase'
import { getLevelInfo } from '../../utils/level-utils'
import {
  getAchievementIcon,
  getTrophyTier,
  totalAchievements,
} from '../../utils/achievement-utils'
import { getAvatarDataUrl } from '../../utils/avatar-utils'
import AvatarUploader from '../../components/avatar-uploader/AvatarUploader'
import './ProfilePage.css'

function ProfilePage() {
  const {
    currentUser,
    profile,
    loading,
    updateUserProfile,
    uploadAvatar,
    logout,
    deleteAccount,
    reauthenticate,
  } = useAuth()
  const { userId } = useParams()
  const [status, setStatus] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [password, setPassword] = useState('')
  const [viewProfile, setViewProfile] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [viewError, setViewError] = useState('')
  const providerId = currentUser?.providerData?.[0]?.providerId

  const isViewingSelf = !userId || userId === currentUser?.uid

  useEffect(() => {
    if (!userId || isViewingSelf) {
      setViewProfile(null)
      setViewError('')
      return
    }

    let isActive = true
    setIsLoadingProfile(true)
    setViewError('')

    getDoc(doc(db, 'users', userId))
      .then((snapshot) => {
        if (!isActive) return
        if (snapshot.exists()) {
          setViewProfile({ id: snapshot.id, ...snapshot.data() })
        } else {
          setViewError('Profile not found.')
        }
      })
      .catch(() => {
        if (!isActive) return
        setViewError('Profile unavailable. Check your connection.')
      })
      .finally(() => {
        if (isActive) setIsLoadingProfile(false)
      })

    return () => {
      isActive = false
    }
  }, [userId, isViewingSelf])

  if (!currentUser && !userId && !loading) {
    return <Navigate to="/auth" replace />
  }

  const fallbackProfile =
    currentUser && isViewingSelf
      ? {
          displayName:
            currentUser.displayName ||
            currentUser.email?.split('@')[0] ||
            'Night Reader',
          photoURL:
            currentUser.photoURL ||
            currentUser?.providerData?.find((provider) => provider.photoURL)
              ?.photoURL ||
            getAvatarDataUrl(currentUser.displayName, currentUser.email),
          xp: 0,
          achievements: [],
          completedComics: [],
        }
      : null

  const activeProfile = isViewingSelf ? profile || fallbackProfile : viewProfile
  const xpValue = activeProfile?.xp || 0
  const levelInfo = getLevelInfo(xpValue)
  const achievementCount = activeProfile?.achievements?.length || 0
  const trophyTier = getTrophyTier(achievementCount, totalAchievements)

  const handleAvatarUpload = async (file) => {
    if (!file) return
    setStatus('Uploading avatar...')
    try {
      const url = await uploadAvatar(file)
      await updateUserProfile({ photoURL: url })
      setStatus('Avatar updated.')
    } catch (err) {
      setStatus(err.message || 'Upload failed.')
    }
  }

  const handleAvatarUrl = async (url) => {
    if (!url) return
    setStatus('Saving avatar URL...')
    try {
      await updateUserProfile({ photoURL: url })
      setStatus('Avatar updated.')
    } catch (err) {
      setStatus(err.message || 'Could not update avatar.')
    }
  }

  const handleDisplayName = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const displayName = formData.get('displayName')
    if (!displayName) return
    setStatus('Updating profile...')
    try {
      await updateUserProfile({ displayName })
      setStatus('Profile updated.')
    } catch (err) {
      setStatus(err.message || 'Could not update profile.')
    }
  }

  const avatarUrl =
    activeProfile?.photoURL ||
    currentUser?.photoURL ||
    currentUser?.providerData?.find((provider) => provider.photoURL)?.photoURL

  if (loading && !activeProfile) {
    return null
  }

  return (
    <main className="profile-page">
      <section className="profile-card profile-enter">
        <div className="profile-header">
          <div>
            <h1>
              {isViewingSelf
                ? 'Your Profile'
                : `${activeProfile?.displayName || 'Night Reader'} Profile`}
            </h1>
            <p className="profile-subtitle">
              Level {levelInfo.level} · {xpValue} XP
            </p>
          </div>
          <div className="profile-actions">
            {isViewingSelf ? (
              <button type="button" onClick={logout}>
                Log out
              </button>
            ) : (
              <NavLink to="/leaderboard" className="profile-back">
                Back to Leaderboard
              </NavLink>
            )}
          </div>
        </div>

        {viewError ? <p className="profile-status">{viewError}</p> : null}

        {activeProfile ? (
          <>
            <div className="profile-hero">
              <div className="profile-avatar-large">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={activeProfile?.displayName}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span>PB</span>
                )}
              </div>
              <div className="profile-level">
                <div className="profile-name-row">
                  {trophyTier !== 'none' ? (
                    <span
                      className={`trophy-badge trophy-${trophyTier}`}
                      aria-label={`${trophyTier} trophy`}
                    >
                      <FaTrophy />
                    </span>
                  ) : null}
                  <h2
                    className={`profile-name trophy-name ${trophyTier !== 'none' ? `tier-${trophyTier}` : ''}`}
                  >
                    {activeProfile?.displayName || 'Night Reader'}
                  </h2>
                </div>
                <span className="profile-label">Level Progress</span>
                <div className="level-track">
                  <div
                    className="level-fill"
                    style={{ width: `${levelInfo.progress * 100}%` }}
                  />
                </div>
                <p className="level-meta">
                  Next level at {levelInfo.nextLevelXp} XP
                </p>
              </div>
            </div>

            <div className="profile-layout">
              {isViewingSelf ? (
                <div className="profile-settings">
                  <div className="profile-panel identity-panel">
                <h2>Identity</h2>
                {isViewingSelf ? (
                  <>
                    <p className="profile-label">Email</p>
                    <p>{currentUser?.email}</p>
                  </>
                ) : null}
                <p className="profile-label">Display name</p>
                <p>{activeProfile?.displayName}</p>
                {isViewingSelf ? (
                  <form onSubmit={handleDisplayName} className="display-form">
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Update display name"
                    />
                    <button type="submit">Save</button>
                  </form>
                ) : null}
                  </div>
                  <div className="profile-panel avatar-panel">
                    <h2>Avatar</h2>
                    <AvatarUploader
                      currentAvatar={avatarUrl}
                      onUpload={handleAvatarUpload}
                      onUrlSave={handleAvatarUrl}
                    />
                  </div>
                </div>
              ) : null}
              <div className="profile-panel progress-panel">
                <h2>Progress</h2>
                <div className="profile-stats">
                  <div className="stat-card">
                    <span className="stat-icon">
                      <FaBolt />
                    </span>
                    <div>
                      <span className="stat-label">XP</span>
                      <strong>{xpValue}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">
                      <FaBook />
                    </span>
                    <div>
                      <span className="stat-label">Comics</span>
                      <strong>{activeProfile?.completedComics?.length || 0}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="stat-icon">
                      <FaTrophy />
                    </span>
                    <div>
                      <span className="stat-label">Achievements</span>
                      <strong>
                        {achievementCount}/{totalAchievements}
                      </strong>
                    </div>
                  </div>
                </div>
                <p className="profile-label">
                  Achievements ({achievementCount}/{totalAchievements})
                </p>
                <ul className="achievement-list">
                  {(activeProfile?.achievements || []).length ? (
                    activeProfile.achievements.map((achievement) => {
                      const { Icon, color } = getAchievementIcon(achievement)
                      return (
                        <li key={achievement} className="achievement-item">
                          <span
                            className="achievement-badge"
                            style={{ backgroundColor: color }}
                          >
                            <Icon />
                          </span>
                          <span>{achievement}</span>
                        </li>
                      )
                    })
                  ) : (
                    <li className="achievement-empty">No achievements yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        ) : null}

        {status ? <p className="profile-status">{status}</p> : null}
        {isViewingSelf ? (
          <div className="delete-panel">
            <button
              type="button"
              className="delete-account"
              disabled={deleting}
              onClick={() => setConfirmDelete((prev) => !prev)}
            >
              {confirmDelete ? 'Cancel Delete' : 'Delete Account'}
            </button>
            {confirmDelete ? (
              <div className="delete-confirm">
                <p>Confirm deletion? This cannot be undone.</p>
                {providerId === 'password' ? (
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                ) : (
                  <p>Google accounts will open a re-auth popup.</p>
                )}
                <button
                  type="button"
                  className="delete-confirm-button"
                  disabled={deleting}
                  onClick={async () => {
                    if (deleting) return
                    setDeleting(true)
                    setStatus('Deleting account...')
                    try {
                      await reauthenticate({ password })
                      await deleteAccount()
                    } catch (err) {
                      setStatus(err.message || 'Could not delete account.')
                      setDeleting(false)
                    }
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete now'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default ProfilePage
