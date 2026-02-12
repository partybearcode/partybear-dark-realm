import './PageHero.css'

function PageHero({
  title,
  subtitle,
  image,
  imagePosition,
  issue,
  location,
  badge,
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-text" data-reveal="rise">
        <span className="page-hero-issue">{issue}</span>
        {badge ? <span className="page-hero-badge">{badge}</span> : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="page-hero-location">
          <span>Location</span>
          <strong>{location}</strong>
        </div>
      </div>
      <div className="page-hero-image" data-reveal="ink">
        <div
          className="page-hero-art"
          style={{
            backgroundImage: `url(${image})`,
            backgroundPosition: imagePosition || 'center',
          }}
        />
        <span className="page-hero-splash" aria-hidden="true" />
      </div>
    </section>
  )
}

export default PageHero
