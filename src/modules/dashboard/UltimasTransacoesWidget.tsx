import { DashboardResumo } from '../../types/dashboard'

interface UltimasTransacoesWidgetProps {
  transacoes: DashboardResumo['ultimasTransacoes']
}

export function UltimasTransacoesWidget({ transacoes }: UltimasTransacoesWidgetProps) {
  const formatarValor = (valor: number, tipo: string) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(valor))

    if (tipo === 'DEPOSITO') return `+${formatted}`
    if (tipo === 'SAQUE' || tipo === 'PIX' || tipo === 'COMPRA_CREDITO') return `-${formatted}`
    return formatted
  }

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr)
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)

    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (data.toDateString() === ontem.toDateString()) {
      return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
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
      <h3 className="widget__header">Últimas Transações</h3>
      <div className="ultimas-transacoes-widget__list">
        {transacoes.length === 0 && (
          <p className="ultimas-transacoes-widget__empty">Nenhuma transação recente</p>
        )}
        {transacoes.map((t) => (
          <div key={t.id} className="ultimas-transacoes-widget__item">
            <div
              className="ultimas-transacoes-widget__icon"
              style={{
                backgroundColor: (t.categoriaCorHexadecimal || '#888') + '20',
                color: t.categoriaCorHexadecimal || '#888',
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                {t.tipo === 'DEPOSITO' ? (
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                ) : (
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                )}
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div className="ultimas-transacoes-widget__info">
              <span className="ultimas-transacoes-widget__descricao">{t.descricao}</span>
              <span className="ultimas-transacoes-widget__categoria">
                {t.categoriaNome || 'Sem categoria'} &middot; {formatarData(t.data)}
              </span>
            </div>
            <span
              className={`ultimas-transacoes-widget__valor ${
                t.tipo === 'DEPOSITO'
                  ? 'ultimas-transacoes-widget__valor--receita'
                  : 'ultimas-transacoes-widget__valor--despesa'
              }`}
            >
              {formatarValor(t.valor, t.tipo)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}