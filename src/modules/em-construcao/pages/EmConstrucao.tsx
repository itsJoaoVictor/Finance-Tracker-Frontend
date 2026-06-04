import './EmConstrucao.css'

type EmConstrucaoProps = {
  moduleName?: string
}

export function EmConstrucao({ moduleName = 'este módulo' }: EmConstrucaoProps) {
  return (
    <div className="construction">
      <header className="construction__brand">
        <div className="construction__logo">FT</div>
        <div className="construction__brand-name">Finance Tracker</div>
      </header>

      <main className="construction__card">
        <span className="construction__tag">Estamos em construção</span>
        <h1 className="construction__title">Uma nova experiência está chegando.</h1>
        <p className="construction__subtitle">
          A tela de <strong>{moduleName}</strong> está sendo preparada com carinho.
        </p>

        <div className="construction__status">
          <div>
            <span className="construction__status-label">Módulo</span>
            <span className="construction__status-value">{moduleName}</span>
          </div>
          <div>
            <span className="construction__status-label">Status</span>
            <span className="construction__status-value">Em construção</span>
          </div>
        </div>
      </main>

      <footer className="construction__footer">
        © 2026 Finance Tracker. Em evolução constante.
      </footer>
    </div>
  )
}
