import { useMemo } from 'react'
import { AlertTriangle, Sparkles, ThumbsUp, ThumbsDown, X } from 'lucide-react'
import { iaService, IaInsight } from '../../../services/iaService'
import './AICardHighlights.css'

const HIGHLIGHT_TIPOS = new Set([
  'CONCENTRACAO_GASTOS_FATURA',
  'ESTOURO_FATURA',
  'AVISO_FECHAMENTO'
])

const TIPO_CONFIG: Record<string, { icon: string; label: string; cssClass: string }> = {
  CONCENTRACAO_GASTOS_FATURA: {
    icon: '⚠️',
    label: 'Concentração de Gastos',
    cssClass: 'ai-highlight-card--concentracao'
  },
  ESTOURO_FATURA: {
    icon: '🚨',
    label: 'Risco de Estouro',
    cssClass: 'ai-highlight-card--concentracao'
  },
  AVISO_FECHAMENTO: {
    icon: '📅',
    label: 'Fechamento Próximo',
    cssClass: 'ai-highlight-card--otimizacao'
  }
}

interface AICardHighlightsProps {
  insights: IaInsight[]
  onDismiss: (id: string) => void
  embedded?: boolean
}

export function AICardHighlights({ insights, onDismiss, embedded = false }: AICardHighlightsProps) {
  // Filtra e deduplica insights idênticos (mesmo tipo + título + mensagem)
  const highlightInsights = useMemo(() => {
    const seen = new Set<string>()
    return insights.filter((ins) => {
      if (!HIGHLIGHT_TIPOS.has(ins.tipo)) return false
      const key = `${ins.tipo}::${ins.titulo?.trim()}::${ins.mensagem?.trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [insights])

  if (highlightInsights.length === 0) {
    if (!embedded) return null
    return (
      <div className="ai-highlights-empty">
        <Sparkles size={22} />
        <p>Nenhum alerta crítico de concentração ou estouro detectado nas suas faturas atuais.</p>
      </div>
    )
  }

  const handleDismiss = async (id: string) => {
    try {
      await iaService.marcarComoLido(id)
      onDismiss(id)
    } catch {
      onDismiss(id)
    }
  }

  const handleFeedback = async (id: string, relevante: boolean) => {
    try {
      await iaService.enviarFeedback(id, relevante)
      onDismiss(id)
    } catch {
      onDismiss(id)
    }
  }

  return (
    <div className={`ai-highlights-section ${embedded ? 'ai-highlights-section--embedded' : ''}`}>
      {!embedded && (
        <>
          <div className="ai-highlights-section__header">
            <span className="ai-highlights-section__icon">✨</span>
            <h3 className="ai-highlights-section__title">Destaques da IA</h3>
          </div>
          <p className="ai-highlights-section__subtitle">
            Insights personalizados sobre seus cartões de crédito
          </p>
        </>
      )}

      <div className="ai-highlights-list">
        {highlightInsights.map((insight) => {
          const config = TIPO_CONFIG[insight.tipo] || {
            icon: '🤖',
            label: 'Insight IA',
            cssClass: ''
          }
          return (
            <div key={insight.id} className={`ai-highlight-card ${config.cssClass}`}>
              <div className="ai-highlight-card__header">
                <div className="ai-highlight-card__title-group">
                  <span className="ai-highlight-card__badge">
                    <AlertTriangle size={12} />
                    {config.label}
                  </span>
                  <span className="ai-highlight-card__title">{insight.titulo}</span>
                </div>
                <button
                  type="button"
                  className="ai-highlight-card__dismiss"
                  onClick={() => handleDismiss(insight.id)}
                  title="Dispensar"
                  aria-label="Dispensar alerta"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="ai-highlight-card__message">{insight.mensagem}</p>
              <div className="ai-highlight-card__actions">
                <button
                  type="button"
                  className="ai-highlight-card__feedback-btn ai-highlight-card__feedback-btn--yes"
                  onClick={() => handleFeedback(insight.id, true)}
                >
                  <ThumbsUp size={12} /> Útil
                </button>
                <button
                  type="button"
                  className="ai-highlight-card__feedback-btn ai-highlight-card__feedback-btn--no"
                  onClick={() => handleFeedback(insight.id, false)}
                >
                  <ThumbsDown size={12} /> Irrelevante
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
