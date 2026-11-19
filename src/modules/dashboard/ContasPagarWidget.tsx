import { useNavigate } from 'react-router-dom'
import { ContasPagarDashboard } from '../../types/dashboard'
import { CalendarClock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

interface ContasPagarWidgetProps {
  dados: ContasPagarDashboard
  ocultarValores?: boolean
}

export function ContasPagarWidget({ dados, ocultarValores = false }: ContasPagarWidgetProps) {
  const navigate = useNavigate()

  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
  }

  const formatarData = (dataStr: string) => {
    const parts = dataStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`
    return dataStr
  }

  const totalAPagarMes = (dados.totalPendenteMes || 0) + (dados.totalEstimadoMes || 0)

  return (
    <div className="widget contas-pagar-widget">
      <div className="widget__header-row">
        <div className="widget__header-title">
          <CalendarClock size={18} className="widget__header-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>Contas & Boletos do Mês</h3>
        </div>
        <button
          type="button"
          className="widget__action-link"
          onClick={() => navigate('/contas-pagar')}
        >
          <span>Ver grade</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="contas-pagar-widget__summary-grid">
        <div className="contas-pagar-widget__stat contas-pagar-widget__stat--pago">
          <span className="contas-pagar-widget__stat-label">Pago no mês</span>
          <span className="contas-pagar-widget__stat-value">{formatar(dados.totalPagoMes)}</span>
        </div>
        <div className="contas-pagar-widget__stat contas-pagar-widget__stat--pendente">
          <span className="contas-pagar-widget__stat-label">A pagar no mês</span>
          <span className="contas-pagar-widget__stat-value">{formatar(totalAPagarMes)}</span>
        </div>
        <div
          className={`contas-pagar-widget__stat ${
            dados.qtdAtrasadas > 0
              ? 'contas-pagar-widget__stat--atraso'
              : 'contas-pagar-widget__stat--neutro'
          }`}
        >
          <span className="contas-pagar-widget__stat-label">
            Em atraso ({dados.qtdAtrasadas})
          </span>
          <span className="contas-pagar-widget__stat-value">{formatar(dados.totalAtrasado)}</span>
        </div>
      </div>

      <div className="contas-pagar-widget__upcoming">
        <div className="contas-pagar-widget__upcoming-header">
          <span>Atrasadas & Vencendo nos próximos 7 dias</span>
          <span className="contas-pagar-widget__upcoming-count">
            {dados.proximasOuAtrasadas.length}
          </span>
        </div>

        {dados.proximasOuAtrasadas.length === 0 ? (
          <div className="contas-pagar-widget__empty-ok">
            <CheckCircle2 size={17} />
            <span>Nenhuma conta atrasada ou vencendo nos próximos 7 dias.</span>
          </div>
        ) : (
          <div className="contas-pagar-widget__list">
            {dados.proximasOuAtrasadas.slice(0, 5).map((item) => {
              const isAtrasada = item.statusEfetivo === 'ATRASADA'
              return (
                <div
                  key={item.ocorrenciaId}
                  onClick={() => navigate('/contas-pagar')}
                  className={`contas-pagar-widget__item ${
                    isAtrasada ? 'contas-pagar-widget__item--atrasada' : ''
                  }`}
                >
                  <div className="contas-pagar-widget__item-info">
                    <span className="contas-pagar-widget__item-name">
                      {isAtrasada && <AlertTriangle size={14} className="contas-pagar-widget__alert-icon" />}
                      <span className="contas-pagar-widget__item-title">{item.nome}</span>
                      {item.numeroParcela && item.totalParcelas && (
                        <span className="contas-pagar-widget__item-parcela">
                          ({item.numeroParcela}/{item.totalParcelas})
                        </span>
                      )}
                    </span>
                    <span className="contas-pagar-widget__item-meta">
                      Vence {formatarData(item.dataVencimento)}
                      {item.agrupador ? ` · ${item.agrupador}` : ''}
                    </span>
                  </div>

                  <div className="contas-pagar-widget__item-right">
                    <div
                      className={`contas-pagar-widget__item-valor ${
                        isAtrasada ? 'contas-pagar-widget__item-valor--atrasada' : ''
                      } ${item.valorEstimado ? 'contas-pagar-widget__item-valor--estimado' : ''}`}
                    >
                      {item.valorEstimado ? '~ ' : ''}
                      {formatar(item.valorEfetivo)}
                    </div>
                    <span
                      className={`contas-pagar-widget__badge ${
                        isAtrasada
                          ? 'contas-pagar-widget__badge--atrasada'
                          : item.valorEstimado
                          ? 'contas-pagar-widget__badge--estimado'
                          : 'contas-pagar-widget__badge--pendente'
                      }`}
                    >
                      {isAtrasada ? 'Atrasada' : item.valorEstimado ? 'Estimado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
