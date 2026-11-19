import { useNavigate } from 'react-router-dom'
import { ArrowRight, Receipt, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface UltimasTransacoesWidgetProps {
  transacoes: DashboardResumo['ultimasTransacoes']
  ocultarValores?: boolean
}

const TIPO_LABELS: Record<string, string> = {
  DEPOSITO: 'Depósito',
  SAQUE: 'Saque',
  PIX: 'Pix',
  COMPRA_CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferência',
  PAGAMENTO_CREDITO: 'Pag. Fatura',
  PAGAMENTO_BOLETO: 'Boleto',
}

export function UltimasTransacoesWidget({
  transacoes,
  ocultarValores = false,
}: UltimasTransacoesWidgetProps) {
  const navigate = useNavigate()

  const formatarValor = (valor: number, tipo: string) => {
    if (ocultarValores) return 'R$ •••••'
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(valor))

    if (tipo === 'DEPOSITO') return `+${formatted}`
    if (
      tipo === 'SAQUE' ||
      tipo === 'PIX' ||
      tipo === 'COMPRA_CREDITO' ||
      tipo === 'PAGAMENTO_BOLETO' ||
      tipo === 'PAGAMENTO_CREDITO'
    )
      return `-${formatted}`
    return formatted
  }

  const getValorClass = (tipo: string) => {
    if (tipo === 'DEPOSITO') return 'ultimas-transacoes-widget__valor--receita'
    if (tipo === 'TRANSFERENCIA' || tipo === 'PAGAMENTO_CREDITO')
      return 'ultimas-transacoes-widget__valor--neutro'
    return 'ultimas-transacoes-widget__valor--despesa'
  }

  const getIcon = (tipo: string) => {
    if (tipo === 'DEPOSITO') return <ArrowUpRight size={17} />
    if (tipo === 'TRANSFERENCIA' || tipo === 'PAGAMENTO_CREDITO')
      return <ArrowLeftRight size={16} />
    return <ArrowDownLeft size={17} />
  }

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr)
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)

    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje, ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (data.toDateString() === ontem.toDateString()) {
      return `Ontem, ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="widget ultimas-transacoes-widget">
      <div className="widget__header-row">
        <div className="widget__header-title">
          <Receipt size={18} className="widget__header-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>Últimas Transações</h3>
        </div>
        <button
          type="button"
          className="widget__action-link"
          onClick={() => navigate('/transacoes')}
        >
          <span>Ver todas</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="ultimas-transacoes-widget__list">
        {transacoes.length === 0 && (
          <p className="ultimas-transacoes-widget__empty">Nenhuma transação recente</p>
        )}
        {transacoes.slice(0, 6).map((t) => {
          const cor =
            t.categoriaCorHexadecimal ||
            (t.tipo === 'DEPOSITO'
              ? '#10b981'
              : t.tipo === 'TRANSFERENCIA' || t.tipo === 'PAGAMENTO_CREDITO'
              ? '#3b82f6'
              : '#64748b')

          return (
            <div
              key={t.id}
              className="ultimas-transacoes-widget__item"
              onClick={() => navigate('/transacoes')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/transacoes')
              }}
            >
              <div
                className="ultimas-transacoes-widget__icon"
                style={{
                  backgroundColor: `${cor}1A`,
                  color: cor,
                }}
              >
                {getIcon(t.tipo)}
              </div>

              <div className="ultimas-transacoes-widget__info">
                <span className="ultimas-transacoes-widget__descricao">{t.descricao}</span>
                <div className="ultimas-transacoes-widget__meta">
                  <span className="ultimas-transacoes-widget__categoria">
                    {t.categoriaNome || 'Sem categoria'}
                  </span>
                  <span className="ultimas-transacoes-widget__dot">&middot;</span>
                  <span className="ultimas-transacoes-widget__tipo-badge">
                    {TIPO_LABELS[t.tipo] || t.tipo}
                  </span>
                  <span className="ultimas-transacoes-widget__dot">&middot;</span>
                  <span className="ultimas-transacoes-widget__data">{formatarData(t.data)}</span>
                </div>
              </div>

              <span className={`ultimas-transacoes-widget__valor ${getValorClass(t.tipo)}`}>
                {formatarValor(t.valor, t.tipo)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
