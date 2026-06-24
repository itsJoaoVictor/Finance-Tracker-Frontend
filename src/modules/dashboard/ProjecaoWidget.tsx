import { DashboardResumo } from '../../types/dashboard'

interface ProjecaoWidgetProps {
  projecao: DashboardResumo['projetcao15Dias']
}

export function ProjecaoWidget({ projecao }: ProjecaoWidgetProps) {
  const formatar = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

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
        return 'Atenção'
      default:
        return 'Situação Estável'
    }
  }

  return (
    <div className={`widget projecao-widget ${getStatusClass()}`}>
      <h3 className="widget__header">Projeção para 15 Dias</h3>
      <div className="projecao-widget__content">
        <div className="projecao-widget__status">
          <span className="projecao-widget__status-dot" />
          <span className="projecao-widget__status-text">{getStatusLabel()}</span>
        </div>
        <div className="projecao-widget__saldo">
          <span className="projecao-widget__label">Saldo Projetado</span>
          <span className="projecao-widget__valor">{formatar(projecao.saldoProjetado)}</span>
        </div>
        {projecao.mensagem && (
          <p className="projecao-widget__mensagem">{projecao.mensagem}</p>
        )}
      </div>
    </div>
  )
}