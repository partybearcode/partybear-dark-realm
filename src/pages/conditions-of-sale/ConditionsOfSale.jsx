import './ConditionsOfSale.css'

function ConditionsOfSale() {
  return (
    <main className="conditions-of-sale">
      <section className="conditions-card">
        <h1>Conditions of Sale</h1>
        <p>
          The PartyBear arcade experience is free to access in this prototype.
          If future premium content is added, the rules below will apply.
        </p>
        <div className="conditions-grid">
          <div className="conditions-block">
            <h2>Digital access</h2>
            <p>
              Purchases grant access to digital content only. No physical items
              are shipped.
            </p>
          </div>
          <div className="conditions-block">
            <h2>Refunds</h2>
            <p>
              Refunds will be evaluated on a case-by-case basis for technical
              issues.
            </p>
          </div>
          <div className="conditions-block">
            <h2>Account safety</h2>
            <p>
              Keep your login secure. Abuse of XP or achievements may result in
              removal from leaderboards.
            </p>
          </div>
        </div>
        <p className="conditions-note">
          This page is part of the academic prototype and can be updated as the
          project evolves.
        </p>
      </section>
    </main>
  )
}

export default ConditionsOfSale
