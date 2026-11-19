import { Wallet, CreditCard, TrendingUp, ShieldCheck, ShieldAlert } from 'lucide-react'
import { DashboardResumo, ContasPagarDashboard } from '../../types/dashboard'

interface KpiWidgetProps {
  kpis: DashboardResumo['kpis']
  contasPagar?: ContasPagarDashboard
  ocultarValores?: boolean
}

export function KpiWidget({ kpis, contasPagar, ocultarValores = false }: KpiWidgetProps) {
  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0)
  }

  // 1. Limite e Fatura
  const limiteTotal = (kpis.faturaTotalCartoes || 0) + (kpis.limiteTotalDisponivelCartoes || 0)
  const percentualUso =
    limiteTotal > 0 ? Math.min(100, Math.round((kpis.faturaTotalCartoes / limiteTotal) * 100)) : 0

  // 2. Indicador "Dinheiro Livre" (Safe to Spend)
  // Dinheiro Livre = Saldo em Contas - Fatura Total - Boletos a Pagar no Mês (Pendentes + Estimados + Atrasados)
  const boletosCompromissos =
    (contasPagar?.totalPendenteMes || 0) +
    (contasPagar?.totalEstimadoMes || 0) +
    (contasPagar?.totalAtrasado || 0)

  const dinheiroLivre = (kpis.saldoTotal || 0) - (kpis.faturaTotalCartoes || 0) - boletosCompromissos
  const isDinheiroLivrePositivo = dinheiroLivre >= 0

  const totalComprometido = (kpis.faturaTotalCartoes || 0) + boletosCompromissos
  const percentualComprometido =
    (kpis.saldoTotal || 0) > 0
      ? Math.min(100, Math.round((totalComprometido / kpis.saldoTotal) * 100))
      : 100

  const kpisList = [
    {
      key: 'saldo',
      icon: <Wallet size={20} />,
      label: 'Saldo em Contas',
      badge: null,
      badgeClass: '',
      subtitle: 'Soma das contas ativas',
      value: formatar(kpis.saldoTotal),
      cardClass: 'kpi-widget__card--saldo',
      progress: null,
      progressColor: '',
      formula: null,
    },
    {
      key: 'dinheiro-livre',
      icon: isDinheiroLivrePositivo ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />,
      label: 'Dinheiro Livre',
      badge: isDinheiroLivrePositivo ? 'Safe to Spend' : 'Déficit Previsto',
      badgeClass: isDinheiroLivrePositivo ? 'kpi-widget__badge--ok' : 'kpi-widget__badge--critico',
      subtitle: isDinheiroLivrePositivo
        ? 'Disponível após faturas e boletos'
        : 'Compromissos superam o saldo',
      value: (dinheiroLivre > 0 && !ocultarValores ? '+' : '') + formatar(dinheiroLivre),
      cardClass: isDinheiroLivrePositivo
        ? 'kpi-widget__card--dinheiro-livre kpi-widget__card--dinheiro-livre-ok'
        : 'kpi-widget__card--dinheiro-livre kpi-widget__card--dinheiro-livre-critico',
      progress: isDinheiroLivrePositivo ? Math.max(5, 100 - percentualComprometido) : 100,
      progressColor: isDinheiroLivrePositivo ? 'var(--primary, #10b981)' : 'var(--danger, #e11d48)',
      formula: `Saldo ${formatar(kpis.saldoTotal)} − Faturas ${formatar(kpis.faturaTotalCartoes)} − Boletos ${formatar(boletosCompromissos)}`,
    },
    {
      key: 'fatura',
      icon: <CreditCard size={20} />,
      label: 'Fatura Total',
      badge: null,
      badgeClass: '',
      subtitle: limiteTotal > 0 ? `${percentualUso}% do limite utilizado` : 'Cartões de crédito',
      value: formatar(kpis.faturaTotalCartoes),
      cardClass: 'kpi-widget__card--fatura',
      progress: limiteTotal > 0 ? percentualUso : null,
      progressColor:
        percentualUso > 80
          ? 'var(--danger, #e11d48)'
          : percentualUso > 55
          ? 'var(--warning, #f59e0b)'
          : 'var(--primary, #10b981)',
      formula: null,
    },
    {
      key: 'limite',
      icon: <TrendingUp size={20} />,
      label: 'Limite Disponível',
      badge: null,
      badgeClass: '',
      subtitle:
        limiteTotal > 0
          ? `De ${ocultarValores ? 'R$ •••••' : formatar(limiteTotal)} totais`
          : 'Disponível para compras',
      value: formatar(kpis.limiteTotalDisponivelCartoes),
      cardClass: 'kpi-widget__card--limite',
      progress: limiteTotal > 0 ? Math.max(0, 100 - percentualUso) : null,
      progressColor: 'var(--info, #3b82f6)',
      formula: null,
    },
  ]

  return (
    <div className="kpi-widget">
      <div className="kpi-widget__grid">
        {kpisList.map((kpi) => (
          <div key={kpi.key} className={`widget kpi-widget__card ${kpi.cardClass}`}>
            <div className="kpi-widget__top">
              <div className="kpi-widget__label-group">
                <span className="kpi-widget__label">{kpi.label}</span>
                {kpi.badge && (
                  <span className={`kpi-widget__badge ${kpi.badgeClass}`}>{kpi.badge}</span>
                )}
              </div>
              <div className="kpi-widget__icon">{kpi.icon}</div>
            </div>

            <div className="kpi-widget__body">
              <span className="kpi-widget__value">{kpi.value}</span>
              <span className="kpi-widget__subtitle">{kpi.subtitle}</span>
              {kpi.formula && (
                <span className="kpi-widget__formula" title="Saldo − Faturas − Boletos a pagar no mês">
                  {kpi.formula}
                </span>
              )}
            </div>

            {kpi.progress !== null && (
              <div className="kpi-widget__progress-track" title={`${kpi.progress}%`}>
                <div
                  className="kpi-widget__progress-fill"
                  style={{
                    width: `${kpi.progress}%`,
                    backgroundColor: kpi.progressColor,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
