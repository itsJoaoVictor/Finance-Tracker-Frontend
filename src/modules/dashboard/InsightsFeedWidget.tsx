import { useState } from 'react'
import {
  AlertTriangle,
  TrendingUp,
  Bell,
  X,
  Sparkles,
  Coins,
  PiggyBank,
  Clock,
  CalendarDays,
  TrendingDown,
  Trophy,
  Rocket,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface InsightsFeedWidgetProps {
  insights: DashboardResumo['insightsAtivos']
  onDispensar?: (id: string) => void
}

const insightIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  COBRANCA_DUPLICADA: { icon: <AlertTriangle size={20} />, color: '#e11d48' },
  ESTOURO_FATURA: { icon: <TrendingUp size={20} />, color: '#f59e0b' },
  GASTO_INCOMUM: { icon: <AlertTriangle size={20} />, color: '#f59e0b' },
  CARTAO_PREVISAO: { icon: <TrendingUp size={20} />, color: '#3b82f6' },
  MICRO_TRANSACOES: { icon: <Coins size={20} />, color: '#a855f7' },
  ORCAMENTO_SOBRA_META: { icon: <PiggyBank size={20} />, color: '#10b981' },
  DINHEIRO_DORMINDO: { icon: <Clock size={20} />, color: '#06b6d4' },
  RADAR_FIM_SEMANA: { icon: <CalendarDays size={20} />, color: '#f97316' },
  QUEDA_RECEITA: { icon: <TrendingDown size={20} />, color: '#e11d48' },
  REFORCO_POSITIVO: { icon: <Trophy size={20} />, color: '#eab308' },
  ACELERADOR_METAS: { icon: <Rocket size={20} />, color: '#3b82f6' },
  INFLACAO_PESSOAL: { icon: <ShoppingCart size={20} />, color: '#f59e0b' },
  PROJECAO_PARCELAS: { icon: <TrendingUp size={20} />, color: '#3b82f6' },
  SUGESTAO_VENCIMENTO: { icon: <Bell size={20} />, color: '#06b6d4' },
}

export function InsightsFeedWidget({ insights, onDispensar }: InsightsFeedWidgetProps) {
  const [dispensando, setDispensando] = useState<string | null>(null)

  const handleDispensar = async (id: string) => {
    setDispensando(id)
    setTimeout(() => {
      onDispensar?.(id)
    }, 300)
  }

  if (insights.length === 0) {
    return (
      <div className="widget insights-feed-widget insights-feed-widget--compact">
        <div className="insights-feed-widget__compact-banner">
          <div className="insights-feed-widget__compact-icon">
            <Sparkles size={18} />
          </div>
          <div className="insights-feed-widget__compact-text">
            <strong>Destaques da IA</strong>
            <span>Nenhum alerta pendente no momento — sua saúde financeira está estável.</span>
          </div>
          <div className="insights-feed-widget__compact-badge">
            <CheckCircle2 size={15} />
            <span>Tudo em ordem</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="widget insights-feed-widget">
      <div className="widget__header">
        <Sparkles size={18} className="widget__header-icon" />
        <h3>Destaques da IA</h3>
        <span className="insights-feed-widget__count">{insights.length}</span>
      </div>
      <div className="insights-feed-widget__list">
        {insights.map((insight) => {
          const tipoNormalizado = insight.tipo.toLowerCase()
          const config = insightIcons[insight.tipo] || {
            icon: <Bell size={20} />,
            color: 'var(--primary)',
          }

          return (
            <div
              key={insight.id}
              className={`insights-feed-widget__item insights-feed-widget__item--${tipoNormalizado} ${
                dispensando === insight.id ? 'insights-feed-widget__item--dispensando' : ''
              }`}
            >
              <div
                className="insights-feed-widget__icon"
                style={{
                  color: config.color,
                  backgroundColor: `${config.color}18`,
                }}
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
                  <X size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
