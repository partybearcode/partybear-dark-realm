import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import ComicLogo from '../comic-logo/ComicLogo'
import { useAuth } from '../../context/AuthContext'
import { getLevelInfo } from '../../utils/levelUtils'
import { getAvatarDataUrl } from '../../utils/avatarUtils'
import './Header.css'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { currentUser, profile, logout } = useAuth()

  const handleToggle = () => {
    setIsMenuOpen((prevState) => !prevState)
  }

  const handleClose = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }

  const avatarUrl =
    profile?.photoURL ||
    currentUser?.photoURL ||
    currentUser?.providerData?.find((provider) => provider.photoURL)?.photoURL ||
    getAvatarDataUrl(currentUser?.displayName, currentUser?.email)

  const levelInfo = getLevelInfo(profile?.xp || 0)

  return (
    <header className="header">
      <div className="header-shell">
        <NavLink to="/home" className="header-logo" onClick={handleClose}>
          <ComicLogo />
        </NavLink>

        <nav className="header-nav">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              isActive ? 'header-link active' : 'header-link'
            }
            onClick={handleClose}
          >
            Home
          </NavLink>
          <NavLink
            to="/games/fnaf-1"
            className={({ isActive }) =>
              isActive ? 'header-link active' : 'header-link'
            }
            onClick={handleClose}
          >
            Start Reading
          </NavLink>
          <NavLink
            to="/arcade"
            className={({ isActive }) =>
              isActive ? 'header-link active' : 'header-link'
            }
            onClick={handleClose}
          >
            Arcade
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              isActive ? 'header-link active' : 'header-link'
            }
            onClick={handleClose}
          >
            Leaderboard
          </NavLink>
        </nav>

        <div className="header-actions">
          {currentUser ? (
            <NavLink className="profile-chip" to="/profile" onClick={handleClose}>
              <div className="profile-avatar">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile?.displayName || currentUser?.displayName}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span>PB</span>
                )}
              </div>
              <div className="profile-meta">
                <span>{profile?.displayName || 'Night Reader'}</span>
                <strong>Level {levelInfo.level}</strong>
              </div>
            </NavLink>
          ) : null}
          {currentUser ? (
            <button type="button" className="header-logout" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <NavLink className="header-cta" to="/auth" onClick={handleClose}>
              Sign in
            </NavLink>
          )}
          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={handleToggle}
          >
            <span className="menu-line" />
            <span className="menu-line" />
            <span className="menu-line" />
          </button>
        </div>
      </div>

      <div className={`mobile-nav ${isMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-header">
          <span>Dark Realm Menu</span>
          <button type="button" className="mobile-close" onClick={handleClose}>
            Close
          </button>
        </div>
        <NavLink to="/home" className="mobile-link" onClick={handleClose}>
          Home
        </NavLink>
        <NavLink to="/games/fnaf-1" className="mobile-link" onClick={handleClose}>
          Start Reading
        </NavLink>
        <NavLink to="/arcade" className="mobile-link" onClick={handleClose}>
          Arcade
        </NavLink>
        <NavLink to="/leaderboard" className="mobile-link" onClick={handleClose}>
          Leaderboard
        </NavLink>
        {currentUser ? (
          <NavLink className="mobile-link" to="/profile" onClick={handleClose}>
            Profile
          </NavLink>
        ) : null}
        {currentUser ? (
          <button type="button" className="mobile-action" onClick={handleLogout}>
            Log out
          </button>
        ) : (
          <NavLink className="mobile-link" to="/auth" onClick={handleClose}>
            Sign in
          </NavLink>
        )}
      </div>

      <button
        type="button"
        className={`menu-backdrop ${isMenuOpen ? 'is-open' : ''}`}
        aria-label="Close menu"
        onClick={handleClose}
      />
    </header>
  )
}

export default Header
