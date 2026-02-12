import './LoadingScreen.css'

function LoadingScreen({ isVisible }) {
  if (!isVisible) return null

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-vein loading-vein-left" />
      <div className="loading-vein loading-vein-right" />
      <div className="loading-core">
        <span>Summoning the Dark Realm</span>
        <strong>Loading...</strong>
      </div>
    </div>
  )
}

export default LoadingScreen
