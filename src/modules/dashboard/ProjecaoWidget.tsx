import { CalendarRange, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface ProjecaoWidgetProps {
  projecao: DashboardResumo['projetcao15Dias']
  ocultarValores?: boolean
}

export function ProjecaoWidget({ projecao, ocultarValores = false }: ProjecaoWidgetProps) {
  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const formatarMensagemMoeda = (texto?: string) => {
    if (!texto) return ''
    if (ocultarValores) {
      return texto.replace(/R\$\s*-?\d+(?:[.,]\d+)?/g, 'R$ •••••')
    }
    return texto.replace(/R\$\s*(-?\d+(?:\.\d+)?)/g, (_match, numStr) => {
      const parsed = parseFloat(numStr)
      if (isNaN(parsed)) return _match
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsed)
    })
  }

  const getStatusClass = () => {
    switch (projecao.status) {
      case 'CRITICO':
        return 'projecao-widget--critico'
      case 'ATENCAO':
        return 'projecao-widget--atencao'
      default:
        return 'projecao-widget--ok'
    }
  }

  const getStatusLabel = () => {
    switch (projecao.status) {
      case 'CRITICO':
        return 'Saldo Negativo Projetado'
      case 'ATENCAO':
        return 'Atenção no Fluxo'
      default:
        return 'Situação Estável'
    }
  }

  const getStatusIcon = () => {
    switch (projecao.status) {
      case 'CRITICO':
        return <ShieldAlert size={16} />
      case 'ATENCAO':
        return <AlertTriangle size={16} />
      default:
        return <ShieldCheck size={16} />
    }
  }

  return (
    <div className={`widget projecao-widget ${getStatusClass()}`}>
      <div className="projecao-widget__header">
        <div className="projecao-widget__title-group">
          <CalendarRange size={18} className="projecao-widget__title-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>Projeção para 15 Dias</h3>
        </div>
        <div className="projecao-widget__badge">
          <span className="projecao-widget__status-dot" />
          {getStatusIcon()}
          <span className="projecao-widget__status-text">{getStatusLabel()}</span>
        </div>
      </div>

      <div className="projecao-widget__content">
        <div className="projecao-widget__saldo">
          <span className="projecao-widget__label">Saldo Projetado</span>
          <span className="projecao-widget__valor">{formatar(projecao.saldoProjetado)}</span>
        </div>
        {projecao.mensagem && (
          <p className="projecao-widget__mensagem">{formatarMensagemMoeda(projecao.mensagem)}</p>
        )}
      </div>
    </div>
  )
}
