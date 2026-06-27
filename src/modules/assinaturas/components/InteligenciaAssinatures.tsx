import { useState, useEffect } from 'react'
import { iaService, ReajusteDetectado } from '../../../services/iaService'
import './InteligenciaAssinatures.css'

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function InteligenciaAssinatures() {
  const [reajustes, setReajustes] = useState<ReajusteDetectado[]>([])
  const [loading, setLoading] = useState(true)
  const [montado, setMontado] = useState(false)
  const [cardsVisiveis, setCardsVisiveis] = useState<number>(0)

  useEffect(() => {
    iaService.getInteligenciaAssinatura()
      .then(res => setReajustes(res.data.reajustes))
      .catch(() => {})
      .finally(() => setLoading(false))
    requestAnimationFrame(() => requestAnimationFrame(() => setMontado(true)))
  }, [])

  // Staggered card entrance
  useEffect(() => {
    if (!montado || reajustes.length === 0) return
    let idx = 0
    const timer = setInterval(() => {
      idx++
      setCardsVisiveis(idx)
      if (idx >= reajustes.length) clearInterval(timer)
    }, 80)
    return () => clearInterval(timer)
  }, [montado, reajustes.length])

  if (loading) {
    return (
      <div className="reajustes reajustes--skeleton">
        <div className="reajustes__card">
          <div className="reajustes__skeleton-bar" style={{ width: 140, height: 12 }} />
          <div className="reajustes__skeleton-bar" style={{ width: '100%', height: 52, marginTop: 14 }} />
        </div>
      </div>
    )
  }

  if (reajustes.length === 0) return null

  return (
    <div className={`reajustes ${montado ? 'reajustes--montado' : ''}`}>
      <div className="reajustes__card">
        {/* Glow behind card */}
        <div className="reajustes__glow" />

        {/* Header strip */}
        <div className="reajustes__header">
          <div className="reajustes__header-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="reajustes__header-text">
            <h3 className="reajustes__titulo">Reajuste{reajustes.length > 1 ? 's' : ''} Detectado{reajustes.length > 1 ? 's' : ''}</h3>
            <span className="reajustes__subtitulo">
              {reajustes.length} assinatura{reajustes.length > 1 ? 's' : ''} com aumento acima de 5%
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="reajustes__lista">
          {reajustes.map((r, i) => (
            <div
              key={r.assinaturaId}
              className={`reajuste ${cardsVisiveis > i ? 'reajuste--visivel' : ''}`}
            >
              {/* Left: info */}
              <div className="reajuste__info">
                <span className="reajuste__nome">{r.nome}</span>
                <span className="reajuste__categoria">{r.categoria}</span>
                <div className="reajuste__valores">
                  <span className="reajuste__valor-antigo">{formatCurrency(r.valorAnterior)}</span>
                  <span className="reajuste__seta">→</span>
                  <span className="reajuste__valor-novo">{formatCurrency(r.valorAtual)}</span>
                </div>
              </div>

              {/* Right: impact */}
              <div className="reajuste__impacto">
                <span className="reajuste__pct">+{r.percentualAumento.toFixed(1)}%</span>
                <span className="reajuste__impacto-label">impacto anual</span>
                <span className="reajuste__impacto-valor">{formatCurrency(r.impactoAnual)}/ano</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
