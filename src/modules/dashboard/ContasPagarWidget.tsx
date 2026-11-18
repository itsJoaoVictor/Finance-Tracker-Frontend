import { useNavigate } from 'react-router-dom'
import { ContasPagarDashboard } from '../../types/dashboard'
import { CalendarClock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

interface ContasPagarWidgetProps {
  dados: ContasPagarDashboard
}

export function ContasPagarWidget({ dados }: ContasPagarWidgetProps) {
  const navigate = useNavigate()

  const formatar = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)

  const formatarData = (dataStr: string) => {
    const parts = dataStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`
    return dataStr
  }

  const totalAPagarMes = (dados.totalPendenteMes || 0) + (dados.totalEstimadoMes || 0)

  return (
    <div className="widget contas-pagar-widget" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="widget__header" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarClock size={18} />
          Contas & Boletos do Mês
        </h3>
        <button
          type="button"
          onClick={() => navigate('/contas-pagar')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary, #2f5b4b)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Ver grade <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(46, 204, 113, 0.1)' }}>
          <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>Pago no mês</div>
          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#27ae60' }}>
            {formatar(dados.totalPagoMes)}
          </div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(241, 196, 15, 0.12)' }}>
          <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>A pagar no mês</div>
          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#d68910' }}>
            {formatar(totalAPagarMes)}
          </div>
        </div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: dados.qtdAtrasadas > 0 ? 'rgba(231, 76, 60, 0.14)' : 'rgba(128,128,128,0.08)',
          }}
        >
          <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>Em atraso ({dados.qtdAtrasadas})</div>
          <div
            style={{
              fontSize: '0.98rem',
              fontWeight: 700,
              color: dados.qtdAtrasadas > 0 ? '#e74c3c' : 'inherit',
            }}
          >
            {formatar(dados.totalAtrasado)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.7 }}>
          Atrasadas & Vencendo nos próximos 7 dias ({dados.proximasOuAtrasadas.length})
        </div>
        {dados.proximasOuAtrasadas.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(46, 204, 113, 0.08)',
              fontSize: '0.85rem',
              color: '#27ae60',
            }}
          >
            <CheckCircle2 size={16} /> Nenhuma conta atrasada ou vencendo nos próximos 7 dias.
          </div>
        ) : (
          dados.proximasOuAtrasadas.slice(0, 5).map((item) => {
            const isAtrasada = item.statusEfetivo === 'ATRASADA'
            return (
              <div
                key={item.ocorrenciaId}
                onClick={() => navigate('/contas-pagar')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${isAtrasada ? 'rgba(231,76,60,0.35)' : 'var(--border, rgba(128,128,128,0.2))'}`,
                  background: isAtrasada ? 'rgba(231,76,60,0.06)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isAtrasada && <AlertTriangle size={14} color="#e74c3c" />}
                    {item.nome}
                    {item.numeroParcela && item.totalParcelas && (
                      <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>
                        ({item.numeroParcela}/{item.totalParcelas})
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>
                    Vence {formatarData(item.dataVencimento)}
                    {item.agrupador ? ` · ${item.agrupador}` : ''}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      fontStyle: item.valorEstimado ? 'italic' : 'normal',
                      color: isAtrasada ? '#e74c3c' : 'inherit',
                    }}
                  >
                    {item.valorEstimado ? '~ ' : ''}
                    {formatar(item.valorEfetivo)}
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      background: isAtrasada
                        ? 'rgba(231,76,60,0.18)'
                        : item.valorEstimado
                        ? 'rgba(128,128,128,0.18)'
                        : 'rgba(241,196,15,0.2)',
                      color: isAtrasada ? '#e74c3c' : item.valorEstimado ? '#888' : '#b7950b',
                    }}
                  >
                    {isAtrasada ? 'Atrasada' : item.valorEstimado ? 'Sem valor real' : 'Pendente'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
