import {
  FaGithub,
  FaFigma,
  FaYoutube,
  FaTwitch,
  FaXTwitter,
} from 'react-icons/fa6'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>PartyBear's Dark Realm</h3>
          <p>
            A blood-soaked comic archive of FNAF nightmares, Bear Alpha legends,
            and cursed football crossovers.
          </p>
          <div className="footer-socials">
            <a
              href="http://github.com/partybearcode/partybear-dark-realm"
              aria-label="Github"
            >
              <FaGithub />
            </a>
            <a
              href="https://www.figma.com/community/file/1131985803868452168"
              aria-label="Figma"
            >
              <FaFigma />
            </a>
            <a href="https://www.youtube.com" aria-label="YouTube">
              <FaYoutube />
            </a>
            <a href="https://www.twitch.tv" aria-label="Twitch">
              <FaTwitch />
            </a>
            <a href="https://x.com" aria-label="X">
              <FaXTwitter />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Comic Index</h4>
          <a href="/games/fnaf-1">FNAF 1</a>
          <a href="/games/fnaf-4">FNAF 4</a>
          <a href="/games/bear-alpha">Bear Alpha</a>
          <a href="/games/kylian-mbappe-nightmare">Soccer Nightmares</a>
        </div>

        <div className="footer-links">
          <h4>Project Links</h4>
          <a href="/arcade">Phantom Arcade</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="http://github.com/partybearcode/partybear-dark-realm">
            Project Github
          </a>
          <a href="https://www.figma.com/community/file/1131985803868452168">
            Figma Inspiration
          </a>
        </div>

        <div className="footer-form">
          <h4>Comic Alerts</h4>
          <p>Get new pages, lore drops, and night shift warnings.</p>
          <form className="footer-inputs">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="footer-legal">
        <p>
          © 2026 PartyBear's Dark Realm. All rights reserved.
          <a href="/privacy-policy"> Privacy Policy</a> |
          <a href="/conditions-of-sale"> Terms of Sale</a>.
        </p>
      </div>
    </footer>
  )
}

export default Footer
