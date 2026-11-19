import { useMemo, useState } from 'react'
import {
  Sparkles,
  CreditCard,
  CalendarCheck2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
} from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface HealthScoreWidgetProps {
  kpis?: DashboardResumo['kpis']
  contasPagar?: DashboardResumo['contasPagar']
  transacoes?: DashboardResumo['ultimasTransacoes']
  insights?: DashboardResumo['insightsAtivos']
  onAtualizarIa?: () => void
  atualizandoIa?: boolean
}

interface ScoreDiagnostic {
  score: number
  level: 'EXCELENTE' | 'ESTAVEL' | 'ATENCAO'
  color: string
  cartaoScore: number
  cartaoPct: number
  cartaoStatus: string
  boletosScore: number
  boletosAtrasados: number
  boletosStatus: string
  poupancaScore: number
  poupancaPct: number
  poupancaStatus: string
  fraseIa: string
}

export function HealthScoreWidget({
  kpis,
  contasPagar,
  transacoes = [],
  insights = [],
  onAtualizarIa,
  atualizandoIa = false,
}: HealthScoreWidgetProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const diagnostic: ScoreDiagnostic = useMemo(() => {
    // 1. Pilar 1: Cartões de Crédito (Peso: 35 pontos, Ideal < 30%)
    let cartaoScore = 35
    let cartaoPct = 0
    let cartaoStatus = 'Sem cartões'

    const faturaTotal = kpis?.faturaTotalCartoes || 0
    const limiteDisponivel = kpis?.limiteTotalDisponivelCartoes || 0
    const limiteTotal = faturaTotal + limiteDisponivel

    if (limiteTotal > 0) {
      cartaoPct = Math.round((faturaTotal / limiteTotal) * 100)
      if (cartaoPct <= 30) {
        cartaoScore = 35
        cartaoStatus = `${cartaoPct}% (Ideal)`
      } else if (cartaoPct <= 50) {
        cartaoScore = 25
        cartaoStatus = `${cartaoPct}% (Moderado)`
      } else if (cartaoPct <= 80) {
        cartaoScore = 15
        cartaoStatus = `${cartaoPct}% (Alto)`
      } else {
        cartaoScore = 5
        cartaoStatus = `${cartaoPct}% (Crítico)`
      }
    }

    // 2. Pilar 2: Pontualidade de Boletos (Peso: 35 pontos, Zero Atrasos)
    let boletosScore = 35
    const boletosAtrasados = contasPagar?.qtdAtrasadas || 0
    let boletosStatus = '100% Pontual'

    if (boletosAtrasados === 0) {
      boletosScore = 35
      boletosStatus = '0 atrasos (Em dia)'
    } else if (boletosAtrasados === 1) {
      boletosScore = 15
      boletosStatus = '1 em atraso'
    } else {
      boletosScore = 0
      boletosStatus = `${boletosAtrasados} em atraso`
    }

    // 3. Pilar 3: Taxa de Poupança / Balanço Receitas vs Despesas (Peso: 30 pontos)
    let poupancaScore = 20
    let poupancaPct = 0
    let poupancaStatus = 'Sem dados'

    const receitas = transacoes
      .filter((t) => t.tipo === 'DEPOSITO')
      .reduce((acc, t) => acc + Math.abs(t.valor), 0)

    const despesas = transacoes
      .filter(
        (t) =>
          t.tipo === 'SAQUE' ||
          t.tipo === 'PIX' ||
          t.tipo === 'COMPRA_CREDITO' ||
          t.tipo === 'PAGAMENTO_BOLETO'
      )
      .reduce((acc, t) => acc + Math.abs(t.valor), 0)

    if (receitas > 0) {
      poupancaPct = Math.round(((receitas - despesas) / receitas) * 100)
      if (poupancaPct >= 20) {
        poupancaScore = 30
        poupancaStatus = `+${poupancaPct}% (Superávit)`
      } else if (poupancaPct >= 0) {
        poupancaScore = 20
        poupancaStatus = `+${poupancaPct}% (Equilibrado)`
      } else if (poupancaPct >= -30) {
        poupancaScore = 10
        poupancaStatus = `${poupancaPct}% (Déficit leve)`
      } else {
        poupancaScore = 0
        poupancaStatus = `${poupancaPct}% (Déficit alto)`
      }
    } else if (despesas > 0) {
      poupancaScore = 5
      poupancaPct = -100
      poupancaStatus = 'Apenas despesas'
    }

    // Pontuação Final Consolidada (0 a 100)
    const score = Math.min(100, Math.max(0, cartaoScore + boletosScore + poupancaScore))

    let level: 'EXCELENTE' | 'ESTAVEL' | 'ATENCAO' = 'ESTAVEL'
    let color = '#3b82f6'

    if (score >= 80) {
      level = 'EXCELENTE'
      color = 'var(--primary, #10b981)'
    } else if (score >= 55) {
      level = 'ESTAVEL'
      color = '#f59e0b'
    } else {
      level = 'ATENCAO'
      color = 'var(--danger, #e11d48)'
    }

    // Identificar maior categoria de gastos para personalizar a síntese IA
    const mapaCat = new Map<string, number>()
    transacoes
      .filter(
        (t) =>
          t.tipo === 'SAQUE' ||
          t.tipo === 'PIX' ||
          t.tipo === 'COMPRA_CREDITO' ||
          t.tipo === 'PAGAMENTO_BOLETO'
      )
      .forEach((t) => {
        const cat = t.categoriaNome || 'Outros'
        mapaCat.set(cat, (mapaCat.get(cat) || 0) + Math.abs(t.valor))
      })

    let maiorCat = ''
    let maiorCatPct = 0
    if (despesas > 0 && mapaCat.size > 0) {
      const topCat = Array.from(mapaCat.entries()).sort((a, b) => b[1] - a[1])[0]
      if (topCat) {
        maiorCat = topCat[0]
        maiorCatPct = Math.round((topCat[1] / despesas) * 100)
      }
    }

    // Geração da Frase Síntese Inteligente (IA Reasoning)
    let fraseIa = ''

    if (boletosAtrasados > 0) {
      fraseIa = `Alerta de pontualidade: você possui ${boletosAtrasados} conta(s) em atraso. Regularize para eliminar juros e recuperar seu score.`
    } else if (cartaoPct > 70) {
      fraseIa = `Atenção ao limite de cartões: o uso atingiu ${cartaoPct}%. Evite parcelar novas compras este mês para manter margem de segurança.`
    } else if (poupancaPct < -20) {
      fraseIa = `Déficit no fluxo do mês: as despesas superaram as receitas registradas. Reavalie gastos não essenciais nas próximas semanas.`
    } else if (maiorCatPct >= 60 && maiorCat) {
      fraseIa = `Boa saúde geral! Atenção apenas à concentração de ${maiorCatPct}% dos seus gastos na categoria ${maiorCat}.`
    } else if (score >= 80) {
      fraseIa = `Excelente controle financeiro! Contas em dia, limite de cartão seguro (<30%) e taxa saudável de poupança. Bom momento para aportes em Metas.`
    } else {
      fraseIa = `Saúde financeira estável. Mantenha os pagamentos em dia e busque manter o uso do cartão sempre abaixo de 30% do limite total.`
    }

    // Se houver insight prioritário da IA ativo, enriquece a frase
    if (insights.length > 0 && insights[0]?.titulo) {
      const primeiro = insights[0]
      if (primeiro.tipo === 'COBRANCA_DUPLICADA' || primeiro.tipo === 'ESTOURO_FATURA') {
        fraseIa = `Alerta IA prioritário: ${primeiro.titulo}. ${primeiro.mensagem}`
      }
    }

    return {
      score,
      level,
      color,
      cartaoScore,
      cartaoPct,
      cartaoStatus,
      boletosScore,
      boletosAtrasados,
      boletosStatus,
      poupancaScore,
      poupancaPct,
      poupancaStatus,
      fraseIa,
    }
  }, [kpis, contasPagar, transacoes, insights])

  // Parâmetros do SVG Gauge Circular
  const radius = 42
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (diagnostic.score / 100) * circumference

  const getLevelLabel = (level: ScoreDiagnostic['level']) => {
    switch (level) {
      case 'EXCELENTE':
        return 'Excelente'
      case 'ESTAVEL':
        return 'Estável'
      case 'ATENCAO':
        return 'Atenção'
    }
  }

  return (
    <div className="widget health-score-widget">
      <div className="widget__header-row">
        <div className="widget__header-title">
          <Sparkles size={18} className="widget__header-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>
            Score de Saúde Financeira IA
          </h3>
          <button
            type="button"
            className="health-score-widget__info-btn"
            onClick={() => setShowTooltip(!showTooltip)}
            title="Como é calculado o score?"
          >
            <Info size={14} />
          </button>
        </div>

        {onAtualizarIa && (
          <button
            type="button"
            className="widget__action-link widget__action-link--sm"
            onClick={onAtualizarIa}
            disabled={atualizandoIa}
            title="Recalcular diagnóstico com IA"
          >
            <RefreshCw size={13} className={atualizandoIa ? 'dashboard__spinner' : ''} />
            <span>{atualizandoIa ? 'Analisando...' : 'Atualizar IA'}</span>
          </button>
        )}
      </div>

      {showTooltip && (
        <div className="health-score-widget__info-box">
          <p>
            <strong>Como calculamos o seu Score (0 a 100):</strong>
          </p>
          <ul>
            <li>
              <strong>Cartões (35 pts):</strong> Uso ideal do limite abaixo de 30%.
            </li>
            <li>
              <strong>Boletos (35 pts):</strong> Zero atrasos e pagamentos rigorosamente em dia.
            </li>
            <li>
              <strong>Poupança (30 pts):</strong> Superávit no balanço de receitas vs despesas.
            </li>
          </ul>
        </div>
      )}

      <div className="health-score-widget__main">
        {/* Medidor Circular (Radial Gauge) */}
        <div className="health-score-widget__gauge-wrap">
          <svg className="health-score-widget__gauge" viewBox="0 0 104 104">
            {/* Círculo de fundo */}
            <circle
              className="health-score-widget__gauge-bg"
              cx="52"
              cy="52"
              r={radius}
              strokeWidth={strokeWidth}
            />
            {/* Arco de progresso preenchido */}
            <circle
              className="health-score-widget__gauge-fill"
              cx="52"
              cy="52"
              r={radius}
              strokeWidth={strokeWidth}
              stroke={diagnostic.color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="health-score-widget__gauge-center">
            <span className="health-score-widget__score-num">{diagnostic.score}</span>
            <span
              className={`health-score-widget__level-badge health-score-widget__level-badge--${diagnostic.level.toLowerCase()}`}
            >
              {getLevelLabel(diagnostic.level)}
            </span>
          </div>
        </div>

        {/* 3 Pilares de Diagnóstico */}
        <div className="health-score-widget__pillars">
          {/* Pilar Cartões */}
          <div className="health-score-widget__pillar-item">
            <div className="health-score-widget__pillar-icon health-score-widget__pillar-icon--card">
              <CreditCard size={15} />
            </div>
            <div className="health-score-widget__pillar-info">
              <span className="health-score-widget__pillar-label">Cartão de Crédito</span>
              <span className="health-score-widget__pillar-desc">
                {diagnostic.cartaoPct <= 30 ? '< 30% limite ideal' : 'Uso acima de 30%'}
              </span>
            </div>
            <span
              className={`health-score-widget__pillar-badge ${
                diagnostic.cartaoScore >= 25
                  ? 'health-score-widget__pillar-badge--ok'
                  : 'health-score-widget__pillar-badge--warn'
              }`}
            >
              {diagnostic.cartaoStatus}
            </span>
          </div>

          {/* Pilar Boletos */}
          <div className="health-score-widget__pillar-item">
            <div
              className={`health-score-widget__pillar-icon ${
                diagnostic.boletosAtrasados === 0
                  ? 'health-score-widget__pillar-icon--ok'
                  : 'health-score-widget__pillar-icon--warn'
              }`}
            >
              {diagnostic.boletosAtrasados === 0 ? (
                <CalendarCheck2 size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
            </div>
            <div className="health-score-widget__pillar-info">
              <span className="health-score-widget__pillar-label">Pontualidade Boletos</span>
              <span className="health-score-widget__pillar-desc">
                {diagnostic.boletosAtrasados === 0 ? 'Sem pendências vencidas' : 'Contas em atraso'}
              </span>
            </div>
            <span
              className={`health-score-widget__pillar-badge ${
                diagnostic.boletosScore === 35
                  ? 'health-score-widget__pillar-badge--ok'
                  : 'health-score-widget__pillar-badge--critico'
              }`}
            >
              {diagnostic.boletosStatus}
            </span>
          </div>

          {/* Pilar Poupança */}
          <div className="health-score-widget__pillar-item">
            <div
              className={`health-score-widget__pillar-icon ${
                diagnostic.poupancaPct >= 0
                  ? 'health-score-widget__pillar-icon--ok'
                  : 'health-score-widget__pillar-icon--warn'
              }`}
            >
              {diagnostic.poupancaPct >= 0 ? (
                <TrendingUp size={15} />
              ) : (
                <TrendingDown size={15} />
              )}
            </div>
            <div className="health-score-widget__pillar-info">
              <span className="health-score-widget__pillar-label">Taxa de Poupança</span>
              <span className="health-score-widget__pillar-desc">
                {diagnostic.poupancaPct >= 0 ? 'Superávit no período' : 'Déficit no período'}
              </span>
            </div>
            <span
              className={`health-score-widget__pillar-badge ${
                diagnostic.poupancaScore >= 20
                  ? 'health-score-widget__pillar-badge--ok'
                  : 'health-score-widget__pillar-badge--warn'
              }`}
            >
              {diagnostic.poupancaStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Frase Síntese Inteligente (IA Quote) */}
      <div className="health-score-widget__synthesis">
        <div className="health-score-widget__synthesis-badge">
          <span>🤖 Síntese da IA</span>
        </div>
        <p className="health-score-widget__synthesis-text">“{diagnostic.fraseIa}”</p>
      </div>
    </div>
  )
}
