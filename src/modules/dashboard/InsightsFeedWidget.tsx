import { useState } from 'react'
import { AlertTriangle, TrendingUp, Bell, X, Lightbulb, Coins, PiggyBank, Clock, CalendarDays, TrendingDown, Trophy, Rocket, ShoppingCart } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface InsightsFeedWidgetProps {
  insights: DashboardResumo['insightsAtivos']
  onDispensar?: (id: string) => void
}

const insightIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  COBRANCA_DUPLICADA: { icon: <AlertTriangle size={20} />, color: '#FF3B30' },
  ESTOURO_FATURA: { icon: <TrendingUp size={20} />, color: '#FF9500' },
  GASTO_INCOMUM: { icon: <AlertTriangle size={20} />, color: '#FF9500' },
  // Novos insights comportamentais
  MICRO_TRANSACOES: { icon: <Coins size={20} />, color: '#AF52DE' },
  ORCAMENTO_SOBRA_META: { icon: <PiggyBank size={20} />, color: '#34C759' },
  DINHEIRO_DORMINDO: { icon: <Clock size={20} />, color: '#5AC8FA' },
  RADAR_FIM_SEMANA: { icon: <CalendarDays size={20} />, color: '#FF6B35' },
  QUEDA_RECEITA: { icon: <TrendingDown size={20} />, color: '#FF2D55' },
  REFORCO_POSITIVO: { icon: <Trophy size={20} />, color: '#FFD60A' },
  ACELERADOR_METAS: { icon: <Rocket size={20} />, color: '#007AFF' },
  INFLACAO_PESSOAL: { icon: <ShoppingCart size={20} />, color: '#FF9500' },
}

export function InsightsFeedWidget({ insights, onDispensar }: InsightsFeedWidgetProps) {
  const [dispensando, setDispensando] = useState<string | null>(null)

  const handleDispensar = async (id: string) => {
    setDispensando(id)
    // Pequeno delay para animação
    setTimeout(() => {
      onDispensar?.(id)
    }, 300)
  }

  if (insights.length === 0) {
    return (
      <div className="widget insights-feed-widget">
        <div className="widget__header">
          <Bell size={18} />
          <h3>Destaques da IA</h3>
        </div>
        <div className="insights-feed-widget__empty">
          <Lightbulb size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>Nenhum alerta no momento.</p>
          <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Sua saúde financeira está estável!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="widget insights-feed-widget">
      <div className="widget__header">
        <Bell size={18} />
        <h3>Destaques da IA</h3>
        <span className="insights-feed-widget__count">{insights.length}</span>
      </div>
      <div className="insights-feed-widget__list">
        {insights.map((insight) => {
          const tipoNormalizado = insight.tipo.toLowerCase()
          const config = insightIcons[insight.tipo] || { icon: <Bell size={20} color="#007AFF" />, color: '#007AFF' }

          return (
            <div
              key={insight.id}
              className={`insights-feed-widget__item insights-feed-widget__item--${tipoNormalizado} ${
                dispensando === insight.id ? 'insights-feed-widget__item--dispensando' : ''
              }`}
            >
              <div
                className="insights-feed-widget__icon"
                style={{ color: config.color }}
              >
                {config.icon}
              </div>
              <div className="insights-feed-widget__content">
                <strong>{insight.titulo}</strong>
                <p>{insight.mensagem}</p>
              </div>
              {onDispensar && (
                <button
                  className="insights-feed-widget__dismiss"
                  onClick={() => handleDispensar(insight.id)}
                  title="Dispensar"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}