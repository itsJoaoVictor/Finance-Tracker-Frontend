import { iaService, IaInsight } from '../../../services/iaService'
import './AICardHighlights.css'

const HIGHLIGHT_TIPOS = new Set(['CONCENTRACAO_GASTOS_FATURA', 'OTIMIZACAO_PARCELAMENTO'])

const TIPO_CONFIG: Record<string, { icon: string; label: string; cssClass: string }> = {
  CONCENTRACAO_GASTOS_FATURA: {
    icon: '⚠️',
    label: 'Alerta',
    cssClass: 'ai-highlight-card--concentracao',
  },
  OTIMIZACAO_PARCELAMENTO: {
    icon: '🎉',
    label: 'Boa notícia',
    cssClass: 'ai-highlight-card--otimizacao',
  },
}

interface AICardHighlightsProps {
  insights: IaInsight[]
  onDismiss: (id: string) => void
}

export function AICardHighlights({ insights, onDismiss }: AICardHighlightsProps) {
  const highlightInsights = insights.filter((ins) => HIGHLIGHT_TIPOS.has(ins.tipo))

  if (highlightInsights.length === 0) return null

  const handleDismiss = async (id: string) => {
    try {
      await iaService.marcarComoLido(id)
      onDismiss(id)
    } catch {
      /* ignora erro */
    }
  }

  const handleFeedback = async (id: string, relevante: boolean) => {
    try {
      await iaService.enviarFeedback(id, relevante)
      onDismiss(id)
    } catch {
      /* ignora erro */
    }
  }

  return (
    <div className="ai-highlights-section">
      <div className="ai-highlights-section__header">
        <span className="ai-highlights-section__icon">✨</span>
        <h3 className="ai-highlights-section__title">Destaques da IA</h3>
      </div>
      <p className="ai-highlights-section__subtitle">
        Insights personalizados sobre seus cartões de crédito
      </p>

      <div className="ai-highlights-list">
        {highlightInsights.map((insight) => {
          const config = TIPO_CONFIG[insight.tipo] || { icon: '🤖', label: 'Insight', cssClass: '' }
          return (
            <div key={insight.id} className={`ai-highlight-card ${config.cssClass}`}>
              <div className="ai-highlight-card__header">
                <span className="ai-highlight-card__title">
                  <span className="ai-highlight-card__title-icon">{config.icon}</span>
                  {insight.titulo}
                </span>
                <button
                  className="ai-highlight-card__dismiss"
                  onClick={() => handleDismiss(insight.id)}
                  title="Dispensar"
                >
                  ✕
                </button>
              </div>
              <p className="ai-highlight-card__message">{insight.mensagem}</p>
              <div className="ai-highlight-card__actions">
                <button
                  className="ai-highlight-card__feedback-btn ai-highlight-card__feedback-btn--yes"
                  onClick={() => handleFeedback(insight.id, true)}
                >
                  👍 Útil
                </button>
                <button
                  className="ai-highlight-card__feedback-btn ai-highlight-card__feedback-btn--no"
                  onClick={() => handleFeedback(insight.id, false)}
                >
                  👎 Irrelevante
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
