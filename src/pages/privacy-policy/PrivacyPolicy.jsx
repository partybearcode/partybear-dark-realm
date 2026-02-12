import './PrivacyPolicy.css'

function PrivacyPolicy() {
  return (
    <main className="privacy-policy">
      <section className="policy-card">
        <h1>Privacy Policy</h1>
        <p>
          PartyBear's Dark Realm collects only the data needed to power
          authentication, XP, achievements, and leaderboard ranking.
        </p>
        <div className="policy-grid">
          <div className="policy-block">
            <h2>What we collect</h2>
            <ul>
              <li>Email address (for account access).</li>
              <li>Display name and avatar (profile personalization).</li>
              <li>XP, achievements, and completed comics.</li>
            </ul>
          </div>
          <div className="policy-block">
            <h2>How we use it</h2>
            <ul>
              <li>To authenticate users and secure the arcade progress.</li>
              <li>To show leaderboards and achievement notifications.</li>
              <li>To personalize the profile dashboard.</li>
            </ul>
          </div>
          <div className="policy-block">
            <h2>Your control</h2>
            <ul>
              <li>You can update profile details at any time.</li>
              <li>You can delete your account from the profile page.</li>
              <li>We do not sell or share personal data.</li>
            </ul>
          </div>
        </div>
        <p className="policy-note">
          Questions? Contact the project owner using the email listed in the
          repository.
        </p>
      </section>
    </main>
  )
}

export default PrivacyPolicy
