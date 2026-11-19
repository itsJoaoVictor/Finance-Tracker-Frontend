import { Wallet, CreditCard, TrendingUp } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface KpiWidgetProps {
  kpis: DashboardResumo['kpis']
  ocultarValores?: boolean
}

export function KpiWidget({ kpis, ocultarValores = false }: KpiWidgetProps) {
  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0)
  }

  const limiteTotal = (kpis.faturaTotalCartoes || 0) + (kpis.limiteTotalDisponivelCartoes || 0)
  const percentualUso =
    limiteTotal > 0 ? Math.min(100, Math.round((kpis.faturaTotalCartoes / limiteTotal) * 100)) : 0

  const kpisList = [
    {
      key: 'saldo',
      icon: <Wallet size={22} />,
      label: 'Saldo Total',
      subtitle: 'Soma das contas ativas',
      value: formatar(kpis.saldoTotal),
      cardClass: 'kpi-widget__card--saldo',
      progress: null,
    },
    {
      key: 'fatura',
      icon: <CreditCard size={22} />,
      label: 'Fatura Total',
      subtitle: limiteTotal > 0 ? `${percentualUso}% do limite utilizado` : 'Cartões de crédito',
      value: formatar(kpis.faturaTotalCartoes),
      cardClass: 'kpi-widget__card--fatura',
      progress: limiteTotal > 0 ? percentualUso : null,
      progressColor: percentualUso > 80 ? 'var(--danger, #e11d48)' : percentualUso > 55 ? 'var(--warning, #f59e0b)' : 'var(--primary, #10b981)',
    },
    {
      key: 'limite',
      icon: <TrendingUp size={22} />,
      label: 'Limite Disponível',
      subtitle: limiteTotal > 0 ? `De ${ocultarValores ? 'R$ •••••' : formatar(limiteTotal)} totais` : 'Disponível para compras',
      value: formatar(kpis.limiteTotalDisponivelCartoes),
      cardClass: 'kpi-widget__card--limite',
      progress: limiteTotal > 0 ? Math.max(0, 100 - percentualUso) : null,
      progressColor: 'var(--info, #3b82f6)',
    },
  ]

  return (
    <div className="kpi-widget">
      <div className="kpi-widget__grid">
        {kpisList.map((kpi) => (
          <div key={kpi.key} className={`widget kpi-widget__card ${kpi.cardClass}`}>
            <div className="kpi-widget__top">
              <span className="kpi-widget__label">{kpi.label}</span>
              <div className="kpi-widget__icon">{kpi.icon}</div>
            </div>
            <div className="kpi-widget__body">
              <span className="kpi-widget__value">{kpi.value}</span>
              <span className="kpi-widget__subtitle">{kpi.subtitle}</span>
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
