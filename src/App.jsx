import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import Home from './pages/home/Home'
import GamePage from './pages/game/GamePage'
import { comicPages } from './data/comicData'
import { AuthProvider } from './context/AuthContext'
import AuthPage from './pages/auth/AuthPage'
import ProfilePage from './pages/profile/ProfilePage'
import LeaderboardPage from './pages/leaderboard/LeaderboardPage'
import AchievementToast from './components/achievement-toast/AchievementToast'
import ArcadePage from './pages/arcade/ArcadePage'
import PrivacyPolicy from './pages/privacy-policy/PrivacyPolicy'
import ConditionsOfSale from './pages/conditions-of-sale/ConditionsOfSale'
import LoadingScreen from './components/loading-screen/LoadingScreen'
import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = previous
  }, [pathname])

  return null
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const minDelay = 800

    const handleReady = () => {
      setTimeout(() => {
        if (isMounted) setIsLoading(false)
      }, minDelay)
    }

    if (document.readyState === 'complete') {
      handleReady()
    } else {
      window.addEventListener('load', handleReady)
    }

    return () => {
      isMounted = false
      window.removeEventListener('load', handleReady)
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <div className="app">
          <LoadingScreen isVisible={isLoading} />
          <Header />
          <AchievementToast />
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/arcade" element={<ArcadePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/conditions-of-sale" element={<ConditionsOfSale />} />
            {comicPages.map((page) => (
              <Route
                key={page.slug}
                path={`/games/${page.slug}`}
                element={<GamePage slug={page.slug} />}
              />
            ))}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
