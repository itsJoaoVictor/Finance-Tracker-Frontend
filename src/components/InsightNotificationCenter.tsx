import { useEffect, useState } from 'react'
import { iaService, IaInsight } from '../services/iaService'
import './InsightNotificationCenter.css'

export function InsightNotificationCenter() {
  const [insights, setInsights] = useState<IaInsight[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadInsights = async () => {
    setLoading(true)
    try {
      const res = await iaService.getInsights()
      setInsights(res.data)
    } catch {
      // Ignora erro de carregamento silenciosamente
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInsights()
    // Poll a cada 30 segundos
    const interval = setInterval(loadInsights, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarcarComoLido = async (id: string) => {
    try {
      await iaService.marcarComoLido(id)
      setInsights((prev) => prev.filter((item) => item.id !== id))
    } catch {
      // Ignora erro
    }
  }

  const handleFeedback = async (id: string, relevante: boolean) => {
    try {
      await iaService.enviarFeedback(id, relevante)
      // Remove do feed após feedback
      setInsights((prev) => prev.filter((item) => item.id !== id))
    } catch {
      // Ignora erro
    }
  }

  const [processando, setProcessando] = useState(false)

  const handleProcessar = async () => {
    setProcessando(true)
    try {
      await iaService.processarInsights()
      await loadInsights()
    } catch {
      // Ignora erros
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="insight-center-container">
      <button 
        className="insight-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Insights da IA"
      >
        🤖
        {insights.filter((ins) =>
          ins.tipo !== 'CARTAO_PREVISAO' &&
          ins.tipo !== 'ESTOURO_FATURA' &&
          ins.tipo !== 'MELHOR_CARTAO' &&
          ins.tipo !== 'AVISO_FECHAMENTO' &&
          ins.tipo !== 'CONCENTRACAO_GASTOS_FATURA' &&
          ins.tipo !== 'OTIMIZACAO_PARCELAMENTO'
        ).length > 0 && (
          <span className="insight-badge">
            {insights.filter((ins) =>
              ins.tipo !== 'CARTAO_PREVISAO' &&
              ins.tipo !== 'ESTOURO_FATURA' &&
              ins.tipo !== 'MELHOR_CARTAO' &&
              ins.tipo !== 'AVISO_FECHAMENTO' &&
              ins.tipo !== 'CONCENTRACAO_GASTOS_FATURA' &&
              ins.tipo !== 'OTIMIZACAO_PARCELAMENTO'
            ).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="insight-dropdown">
          <div className="insight-dropdown__header">
            <h3>🤖 Insights Preditivos da IA</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="insight-dropdown__refresh"
                onClick={handleProcessar}
                disabled={processando || loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(138, 5, 190, 0.1)', border: '1px solid rgba(138, 5, 190, 0.25)',
                  borderRadius: 6, padding: '4px 10px', cursor: processando ? 'wait' : 'pointer',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 500,
                  opacity: processando ? 0.6 : 1, transition: 'all 0.15s ease',
                }}
              >
                {processando ? '⏳' : '✨'} {processando ? 'Analisando...' : 'Analisar'}
              </button>
              <button className="insight-dropdown__close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="insight-dropdown__body">
            {(loading || processando) && insights.length === 0 && <p className="insight-info">Analisando sua saúde financeira...</p>}
            {!loading && !processando && insights.length === 0 && <p className="insight-info">Nenhum alerta ou anomalia no momento. Bom trabalho! 🎉</p>}

            {insights
              .filter((insight) =>
                insight.tipo !== 'CARTAO_PREVISAO' &&
                insight.tipo !== 'ESTOURO_FATURA' &&
                insight.tipo !== 'MELHOR_CARTAO' &&
                insight.tipo !== 'AVISO_FECHAMENTO' &&
                insight.tipo !== 'CONCENTRACAO_GASTOS_FATURA' &&
                insight.tipo !== 'OTIMIZACAO_PARCELAMENTO'
              )
              .map((insight) => (
                <div key={insight.id} className={`insight-card insight-card--${insight.tipo.toLowerCase()}`}>
                  <div className="insight-card__header">
                    <h4>{insight.titulo}</h4>
                    <button 
                      className="insight-card__dismiss" 
                      onClick={() => handleMarcarComoLido(insight.id)}
                      title="Dispensar"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="insight-card__message">{insight.mensagem}</p>
                  <div className="insight-card__actions">
                    <button 
                      className="insight-card__feedback-btn insight-card__feedback-btn--yes"
                      onClick={() => handleFeedback(insight.id, true)}
                    >
                      👍 Útil
                    </button>
                    <button 
                      className="insight-card__feedback-btn insight-card__feedback-btn--no"
                      onClick={() => handleFeedback(insight.id, false)}
                    >
                      👎 Irrelevante
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
