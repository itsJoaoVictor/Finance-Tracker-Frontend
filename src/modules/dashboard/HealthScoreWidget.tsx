import { useMemo, useState } from 'react'
import {
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface HealthScoreWidgetProps {
  kpis?: DashboardResumo['kpis']
  contasPagar?: DashboardResumo['contasPagar']
  transacoes?: DashboardResumo['ultimasTransacoes']
  insights?: DashboardResumo['insightsAtivos']
  projecao?: DashboardResumo['projetcao15Dias']
  onAtualizarIa?: () => void
  atualizandoIa?: boolean
}

interface ScoreDiagnostic {
  score: number
  level: 'EXCELENTE' | 'ESTAVEL' | 'ATENCAO'
  color: string
  tituloNivel: string
  subtituloNivel: string
  // Pilar 1: Cartão
  cartaoNivel: 'ok' | 'aviso' | 'critico'
  cartaoTitulo: string
  cartaoExplicacao: string
  // Pilar 2: Contas / Boletos
  boletosNivel: 'ok' | 'critico'
  boletosTitulo: string
  boletosExplicacao: string
  // Pilar 3: Poupança / Balanço
  poupancaNivel: 'ok' | 'aviso' | 'critico'
  poupancaTitulo: string
  poupancaExplicacao: string
  // Síntese IA
  fraseSituacao: string
  fraseDica: string
}

export function HealthScoreWidget({
  kpis,
  contasPagar,
  transacoes = [],
  insights = [],
  projecao,
  onAtualizarIa,
  atualizandoIa = false,
}: HealthScoreWidgetProps) {
  const [showAjuda, setShowAjuda] = useState(false)

  const diagnostic: ScoreDiagnostic = useMemo(() => {
    // 1. Pilar Cartão de Crédito (Peso: 35 pts | Ideal: até 30% do limite)
    let cartaoScore = 35
    let cartaoNivel: 'ok' | 'aviso' | 'critico' = 'ok'
    let cartaoTitulo = 'Uso do Cartão'
    let cartaoExplicacao = 'Limite sob controle'

    const faturaTotal = kpis?.faturaTotalCartoes || 0
    const limiteDisponivel = kpis?.limiteTotalDisponivelCartoes || 0
    const limiteTotal = faturaTotal + limiteDisponivel

    if (limiteTotal > 0) {
      const cartaoPct = Math.round((faturaTotal / limiteTotal) * 100)
      if (cartaoPct <= 30) {
        cartaoScore = 35
        cartaoNivel = 'ok'
        cartaoTitulo = `${cartaoPct}% do limite em uso`
        cartaoExplicacao = 'Ótimo! Abaixo do teto seguro de 30%.'
      } else if (cartaoPct <= 60) {
        cartaoScore = 25
        cartaoNivel = 'aviso'
        cartaoTitulo = `${cartaoPct}% do limite em uso`
        cartaoExplicacao = 'Moderado. Tente não passar de 30%.'
      } else if (cartaoPct <= 85) {
        cartaoScore = 15
        cartaoNivel = 'aviso'
        cartaoTitulo = `${cartaoPct}% do limite em uso`
        cartaoExplicacao = 'Atenção. Limite alto compromete sua renda.'
      } else {
        cartaoScore = 5
        cartaoNivel = 'critico'
        cartaoTitulo = `${cartaoPct}% do limite em uso`
        cartaoExplicacao = 'Crítico! Cartão quase no teto máximo.'
      }
    } else {
      cartaoTitulo = 'Sem faturas ativas'
      cartaoExplicacao = 'Você não possui gastos no crédito este mês.'
    }

    // 2. Pilar Boletos e Contas a Pagar (Peso: 35 pts | Ideal: zero atrasos)
    let boletosScore = 35
    let boletosNivel: 'ok' | 'critico' = 'ok'
    let boletosTitulo = 'Contas e Boletos'
    let boletosExplicacao = 'Tudo pago em dia'

    const boletosAtrasados = contasPagar?.qtdAtrasadas || 0

    if (boletosAtrasados === 0) {
      boletosScore = 35
      boletosNivel = 'ok'
      boletosTitulo = 'Contas 100% em dia'
      boletosExplicacao = 'Nenhum boleto ou conta atrasada.'
    } else if (boletosAtrasados === 1) {
      boletosScore = 15
      boletosNivel = 'critico'
      boletosTitulo = '1 conta em atraso'
      boletosExplicacao = 'Pague logo para evitar juros e multas.'
    } else {
      boletosScore = 0
      boletosNivel = 'critico'
      boletosTitulo = `${boletosAtrasados} contas em atraso`
      boletosExplicacao = 'Urgente: contas vencidas acumulando juros.'
    }

    // 3. Pilar Receitas vs Gastos (Peso: 30 pts | Ideal: sobrar dinheiro)
    let poupancaScore = 20
    let poupancaNivel: 'ok' | 'aviso' | 'critico' = 'ok'
    let poupancaTitulo = 'Receitas vs Gastos'
    let poupancaExplicacao = 'Balanço estável'

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
      const taxa = Math.round(((receitas - despesas) / receitas) * 100)
      if (taxa >= 15) {
        poupancaScore = 30
        poupancaNivel = 'ok'
        poupancaTitulo = 'Sobrando dinheiro'
        poupancaExplicacao = `Você guardou ${taxa}% do que recebeu!`
      } else if (taxa >= 0) {
        poupancaScore = 20
        poupancaNivel = 'ok'
        poupancaTitulo = 'Balanço no azul'
        poupancaExplicacao = 'Entradas e saídas estão equilibradas.'
      } else if (taxa >= -30) {
        poupancaScore = 10
        poupancaNivel = 'aviso'
        poupancaTitulo = 'Gastando um pouco a mais'
        poupancaExplicacao = 'Suas saídas passaram ligeiramente o que entrou.'
      } else {
        poupancaScore = 0
        poupancaNivel = 'critico'
        poupancaTitulo = 'Gastos acima da renda'
        poupancaExplicacao = 'Você gastou bem mais do que recebeu no mês.'
      }
    } else if (despesas > 0) {
      poupancaScore = 5
      poupancaNivel = 'aviso'
      poupancaTitulo = 'Apenas despesas registradas'
      poupancaExplicacao = 'Nenhuma entrada registrada neste período ainda.'
    }

    // Score Final (0 a 100)
    let score = Math.min(100, Math.max(0, cartaoScore + boletosScore + poupancaScore))

    // Se a projeção de 15 dias for negativa ou crítica, a saúde financeira precisa refletir esse risco
    const projecaoNegativa = projecao && (projecao.status === 'CRITICO' || projecao.saldoProjetado < 0)
    const projecaoAlerta = projecao && projecao.status === 'ATENCAO'

    if (projecaoNegativa) {
      score = Math.min(score, 45) // Enquadra em ATENÇÃO
    } else if (projecaoAlerta) {
      score = Math.min(score, 68) // Enquadra em ESTÁVEL
    }

    let level: 'EXCELENTE' | 'ESTAVEL' | 'ATENCAO' = 'ESTAVEL'
    let color = '#3b82f6'
    let tituloNivel = 'Sua saúde financeira está estável'
    let subtituloNivel = 'Contas sob controle, com pequenas melhorias possíveis.'

    if (score >= 80) {
      level = 'EXCELENTE'
      color = 'var(--primary, #10b981)'
      tituloNivel = 'Sua saúde financeira está excelente!'
      subtituloNivel = 'Seu dinheiro está equilibrado e trabalhando a seu favor.'
    } else if (score >= 55) {
      level = 'ESTAVEL'
      color = '#f59e0b'
      tituloNivel = 'Sua saúde financeira está equilibrada'
      subtituloNivel = 'Tudo caminha bem, mas fique atento aos gastos e compromissos futuros.'
    } else {
      level = 'ATENCAO'
      color = 'var(--danger, #e11d48)'
      tituloNivel = 'Sua saúde financeira precisa de atenção'
      subtituloNivel = projecaoNegativa
        ? 'Contas a vencer nos próximos 15 dias vão superar seu saldo em conta.'
        : 'Os compromissos do mês estão pesando mais do que deveriam.'
    }

    // Análise de maior categoria de gastos
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

    // Geração das Frases Claras da IA (Situação + Dica Prática)
    let fraseSituacao = ''
    let fraseDica = ''

    if (boletosAtrasados > 0) {
      fraseSituacao = `Você tem ${boletosAtrasados} conta(s) atrasada(s) este mês.`
      fraseDica = 'Priorize quitar esse boleto para estancar juros e multas.'
    } else if (projecaoNegativa && projecao) {
      const valorProj = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projecao.saldoProjetado)
      fraseSituacao = `Atenção aos próximos 15 dias: seu saldo projetado é de ${valorProj} devido a contas a vencer.`
      fraseDica = 'Garanta saldo em conta antes dos vencimentos para evitar entrar no cheque especial.'
    } else if (cartaoScore <= 15 && poupancaNivel === 'critico') {
      fraseSituacao = 'Você gastou mais do que recebeu e a fatura do cartão já passou da metade do limite.'
      fraseDica = 'Evite novas compras a prazo até a fatura fechar e foque apenas em despesas essenciais.'
    } else if (cartaoScore <= 15) {
      fraseSituacao = 'Suas contas estão em dia, mas o cartão de crédito está bastante carregado.'
      fraseDica = 'Se precisar fazer compras nos próximos dias, prefira pagar via Pix ou débito.'
    } else if (maiorCatPct >= 50 && maiorCat) {
      fraseSituacao = `Seu mês está em ordem, mas a categoria "${maiorCat}" concentrou ${maiorCatPct}% de todas as suas despesas.`
      fraseDica = `Avalie se há oportunidades de renegociar ou enxugar gastos em ${maiorCat}.`
    } else if (score >= 80) {
      fraseSituacao = 'Tudo em ordem: contas pagas em dia, cartão seguro e dinheiro sobrando no bolso!'
      fraseDica = 'Aproveite esse saldo livre para enviar um aporte aos seus Cofrinhos.'
    } else {
      fraseSituacao = 'Seu mês está controlado e sem sustos graves.'
      fraseDica = 'Mantenha o uso dos cartões abaixo de 30% do limite para garantir sua tranquilidade.'
    }

    // Enriquecimento se houver insight ativo do usuário
    if (insights.length > 0 && insights[0]?.titulo) {
      const topIns = insights[0]
      if (topIns.tipo === 'COBRANCA_DUPLICADA') {
        fraseSituacao = `Identificamos uma possível cobrança duplicada recente: "${topIns.titulo}".`
        fraseDica = 'Verifique seu extrato para contestar o valor se for cobrança indevida.'
      }
    }

    return {
      score,
      level,
      color,
      tituloNivel,
      subtituloNivel,
      cartaoNivel,
      cartaoTitulo,
      cartaoExplicacao,
      boletosNivel,
      boletosTitulo,
      boletosExplicacao,
      poupancaNivel,
      poupancaTitulo,
      poupancaExplicacao,
      fraseSituacao,
      fraseDica,
    }
  }, [kpis, contasPagar, transacoes, insights, projecao])

  // Parâmetros do SVG Gauge Circular
  const radius = 42
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (diagnostic.score / 100) * circumference

  return (
    <div className="widget health-score-widget">
      {/* Cabeçalho */}
      <div className="widget__header-row">
        <div className="widget__header-title">
          <Sparkles size={18} className="widget__header-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>
            Saúde Financeira
          </h3>
          <span className="health-score-widget__ia-pill">IA Diagnóstico</span>
          <button
            type="button"
            className="health-score-widget__info-btn"
            onClick={() => setShowAjuda(!showAjuda)}
            title="Como funciona o score?"
          >
            <HelpCircle size={15} />
          </button>
        </div>

        {onAtualizarIa && (
          <button
            type="button"
            className="widget__action-link widget__action-link--sm"
            onClick={onAtualizarIa}
            disabled={atualizandoIa}
            title="Recalcular diagnóstico com dados atuais"
          >
            <RefreshCw size={13} className={atualizandoIa ? 'dashboard__spinner' : ''} />
            <span>{atualizandoIa ? 'Analisando...' : 'Atualizar'}</span>
          </button>
        )}
      </div>

      {/* Explicação Simples e Descomplicada */}
      {showAjuda && (
        <div className="health-score-widget__info-box">
          <p>
            <strong>Como o seu Score (0 a 100) é calculado:</strong>
          </p>
          <p style={{ margin: '4px 0', opacity: 0.85 }}>
            Avaliamos 3 coisas essenciais para sua tranquilidade:
          </p>
          <ul>
            <li>
              <strong>Cartões:</strong> Usar no máximo 30% do limite total.
            </li>
            <li>
              <strong>Contas do Mês:</strong> Não deixar nenhum boleto vencer sem pagar.
            </li>
            <li>
              <strong>Balanço:</strong> Fazer com que o dinheiro que entra supere o que sai.
            </li>
          </ul>
        </div>
      )}

      {/* Bloco Central: Medidor Circular + Status Humano */}
      <div className="health-score-widget__hero">
        <div className="health-score-widget__gauge-wrap">
          <svg className="health-score-widget__gauge" viewBox="0 0 104 104">
            <circle
              className="health-score-widget__gauge-bg"
              cx="52"
              cy="52"
              r={radius}
              strokeWidth={strokeWidth}
            />
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
            <span className="health-score-widget__score-max">/ 100</span>
          </div>
        </div>

        <div className="health-score-widget__hero-text">
          <div className="health-score-widget__status-tag-row">
            <span
              className={`health-score-widget__badge health-score-widget__badge--${diagnostic.level.toLowerCase()}`}
            >
              {diagnostic.level === 'EXCELENTE'
                ? '🟢 Excelente'
                : diagnostic.level === 'ESTAVEL'
                ? '🟡 Equilibrada'
                : '🔴 Requer Atenção'}
            </span>
          </div>
          <h4 className="health-score-widget__hero-title">{diagnostic.tituloNivel}</h4>
          <p className="health-score-widget__hero-sub">{diagnostic.subtituloNivel}</p>
        </div>
      </div>

      {/* Os 3 Pilares em Linguagem Direta */}
      <div className="health-score-widget__cards-grid">
        {/* 1. Cartão */}
        <div
          className={`health-score-widget__card-item health-score-widget__card-item--${diagnostic.cartaoNivel}`}
        >
          <div className="health-score-widget__card-head">
            <CreditCard size={15} />
            <span className="health-score-widget__card-category">Cartões</span>
            <span className="health-score-widget__indicator-dot" />
          </div>
          <span className="health-score-widget__card-main">{diagnostic.cartaoTitulo}</span>
          <span className="health-score-widget__card-desc">{diagnostic.cartaoExplicacao}</span>
        </div>

        {/* 2. Boletos */}
        <div
          className={`health-score-widget__card-item health-score-widget__card-item--${diagnostic.boletosNivel}`}
        >
          <div className="health-score-widget__card-head">
            {diagnostic.boletosNivel === 'ok' ? (
              <CheckCircle2 size={15} />
            ) : (
              <AlertTriangle size={15} />
            )}
            <span className="health-score-widget__card-category">Boletos & Contas</span>
            <span className="health-score-widget__indicator-dot" />
          </div>
          <span className="health-score-widget__card-main">{diagnostic.boletosTitulo}</span>
          <span className="health-score-widget__card-desc">{diagnostic.boletosExplicacao}</span>
        </div>

        {/* 3. Poupança */}
        <div
          className={`health-score-widget__card-item health-score-widget__card-item--${diagnostic.poupancaNivel}`}
        >
          <div className="health-score-widget__card-head">
            {diagnostic.poupancaNivel === 'ok' ? (
              <TrendingUp size={15} />
            ) : (
              <TrendingDown size={15} />
            )}
            <span className="health-score-widget__card-category">Receitas vs Gastos</span>
            <span className="health-score-widget__indicator-dot" />
          </div>
          <span className="health-score-widget__card-main">{diagnostic.poupancaTitulo}</span>
          <span className="health-score-widget__card-desc">{diagnostic.poupancaExplicacao}</span>
        </div>
      </div>

      {/* Frase e Recomendação Simples da IA */}
      <div className="health-score-widget__advice-box">
        <div className="health-score-widget__advice-header">
          <div className="health-score-widget__advice-avatar">
            <Sparkles size={14} />
          </div>
          <span className="health-score-widget__advice-title">Resumo & Recomendação da IA</span>
        </div>

        <p className="health-score-widget__advice-statement">{diagnostic.fraseSituacao}</p>

        <div className="health-score-widget__advice-tip">
          <Lightbulb size={15} className="health-score-widget__tip-icon" />
          <p className="health-score-widget__tip-text">
            <strong>O que fazer:</strong> {diagnostic.fraseDica}
          </p>
        </div>
      </div>
    </div>
  )
}
