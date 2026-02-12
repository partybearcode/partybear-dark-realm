import { NavLink } from 'react-router-dom'
import './GameCard.css'

function GameCard({
  title,
  subtitle,
  description,
  image,
  imagePosition,
  slug,
  issue,
}) {
  return (
    <article className="game-card" data-reveal="slam">
      <div
        className="game-image"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: imagePosition || 'center',
        }}
      />
      <div className="game-body">
        <span className="game-issue">{issue}</span>
        <h3>{title}</h3>
        <p className="game-subtitle">{subtitle}</p>
        <p className="game-description">{description}</p>
        <NavLink className="game-link" to={`/games/${slug}`}>
          Read the comic
        </NavLink>
      </div>
    </article>
  )
}

export default GameCard
