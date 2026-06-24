import { useState } from 'react'
import { Eye, EyeOff, Wallet, CreditCard, TrendingUp } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface KpiWidgetProps {
  kpis: DashboardResumo['kpis']
}

export function KpiWidget({ kpis }: KpiWidgetProps) {
  const [ocultarValores, setOcultarValores] = useState(false)

  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ ***'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor)
  }

  const kpisList = [
    {
      key: 'saldo',
      icon: <Wallet size={24} />,
      label: 'Saldo Total',
      value: formatar(kpis.saldoTotal),
      cardClass: 'kpi-widget__card--saldo',
    },
    {
      key: 'fatura',
      icon: <CreditCard size={24} />,
      label: 'Fatura Total',
      value: formatar(kpis.faturaTotalCartoes),
      cardClass: 'kpi-widget__card--fatura',
    },
    {
      key: 'limite',
      icon: <TrendingUp size={24} />,
      label: 'Limite Disponível',
      value: formatar(kpis.limiteTotalDisponivelCartoes),
      cardClass: 'kpi-widget__card--limite',
    },
  ]

  return (
    <div className="widget kpi-widget">
      <div className="widget__header">
        <h3>Resumo Financeiro</h3>
        <button
          className="kpi-widget__toggle"
          onClick={() => setOcultarValores(!ocultarValores)}
          title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {ocultarValores ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div className="kpi-widget__grid">
        {kpisList.map((kpi) => (
          <div key={kpi.key} className={`kpi-widget__card ${kpi.cardClass}`}>
            <div className="kpi-widget__icon">{kpi.icon}</div>
            <div className="kpi-widget__info">
              <span className="kpi-widget__label">{kpi.label}</span>
              <span className="kpi-widget__value">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}