import { Transacao } from '../../../types'
import { RotateCcw, Trash2 } from 'lucide-react'

interface TransacaoCardProps {
  transacao: Transacao
  onEstornar: (t: Transacao) => void
  onExcluir: (t: Transacao) => void
}

const TIPO_LABEL: Record<string, string> = {
  DEPOSITO: 'Depósito',
  SAQUE: 'Saque',
  PIX: 'Pix',
  COMPRA_CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferência',
  PAGAMENTO_CREDITO: 'Pag. Fatura',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateTime(dateStr: string, criadoEmStr?: string): string {
  if (!dateStr) return ''
  const dateParts = dateStr.split('T')[0].split('-')
  let displayDate = dateStr
  if (dateParts.length === 3) {
    const [year, month, day] = dateParts
    displayDate = `${day}/${month}/${year}`
  } else {
    displayDate = new Date(dateStr).toLocaleDateString('pt-BR')
  }

  if (criadoEmStr) {
    const timeParts = criadoEmStr.split('T')
    if (timeParts.length === 2) {
      const timeOnly = timeParts[1].substring(0, 5) // HH:mm
      return `${displayDate} às ${timeOnly}`
    }
  }
  return displayDate
}

export function TransacaoCard({ transacao, onEstornar, onExcluir }: TransacaoCardProps) {
  const isEntrada = transacao.tipo === 'DEPOSITO' || transacao.tipo === 'TRANSFERENCIA'
  const isTransferencia = transacao.tipo === 'TRANSFERENCIA'
  
  // Calculate total value if it has installments
  const totalValor = transacao.totalParcelas && transacao.totalParcelas > 1 
    ? transacao.valor * transacao.totalParcelas 
    : transacao.valor
    
  const valorFormatado = formatCurrency(Math.abs(totalValor))

  function getCorTipo(): string {
    switch (transacao.tipo) {
      case 'DEPOSITO': return '#2f5b4b'
      case 'SAQUE': return '#e67e22'
      case 'PIX': return '#3498db'
      case 'COMPRA_CREDITO': return '#7c5cfc'
      case 'TRANSFERENCIA': return '#1abc9c'
      case 'PAGAMENTO_CREDITO': return '#2c3e50'
      default: return '#999'
    }
  }

  return (
    <div className="transacao-card">
      <div
        className="transacao-card__color-bar"
        style={{ background: getCorTipo() }}
      />

      <div className="transacao-card__body">
        <div className="transacao-card__main">
          <p className="transacao-card__description">{transacao.descricao}</p>

          <div className="transacao-card__meta">
            <span className="transacao-card__date">{formatDateTime(transacao.data, transacao.criadoEm)}</span>

            <span className="transacao-card__id" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              {transacao.id}
            </span>

            {transacao.tipo === 'COMPRA_CREDITO' && transacao.contaOrigemNome && (
              <span className="transacao-card__conta" title="Cartão de crédito">
                Cartão: {transacao.contaOrigemNome}
              </span>
            )}

            {transacao.tipo === 'TRANSFERENCIA' && transacao.contaOrigemNome && transacao.contaDestinoNome && (
              <span className="transacao-card__conta" title="Transferência entre contas">
                {transacao.contaOrigemNome} ➔ {transacao.contaDestinoNome}
              </span>
            )}

            {transacao.tipo === 'DEPOSITO' && transacao.metaOrigemNome && (
              <span className="transacao-card__conta" title="Origem do cofrinho">
                Cofrinho: {transacao.metaOrigemNome}
                {transacao.contaDestinoNome && (
                  <> ➔ Conta: {transacao.contaDestinoNome}</>
                )}
              </span>
            )}

            {transacao.tipo === 'DEPOSITO' && !transacao.metaOrigemNome && transacao.contaDestinoNome && (
              <span className="transacao-card__conta" title="Conta de depósito">
                Conta: {transacao.contaDestinoNome}
              </span>
            )}

            {(transacao.tipo === 'SAQUE' || transacao.tipo === 'PIX') && transacao.contaOrigemNome && (
              <span className="transacao-card__conta" title="Conta de origem">
                Conta: {transacao.contaOrigemNome}
                {transacao.metaDestinoNome && (
                  <> ➔ Cofrinho: {transacao.metaDestinoNome}</>
                )}
              </span>
            )}

            {transacao.totalParcelas !== undefined && transacao.totalParcelas > 1 && (
              <span className="transacao-card__parcela" style={{ background: 'rgba(124, 92, 252, 0.1)', color: '#7c5cfc' }}>
                dividido em {transacao.totalParcelas} de {formatCurrency(Math.abs(transacao.valor))}
              </span>
            )}

            {transacao.estornada && (
              <span className="transacao-card__estornada">Estornada</span>
            )}
          </div>

          {transacao.alertaOrcamento && transacao.alertaOrcamento.atingido && (
            <div className="transacao-card__alert">
              Alerta de orçamento: {transacao.alertaOrcamento.percentual.toFixed(0)}% consumido
              (limite: {formatCurrency(transacao.alertaOrcamento.limite)})
            </div>
          )}
        </div>

        <div className="transacao-card__value-section">
          <span
            className={`transacao-card__value ${isEntrada ? 'transacao-card__value--positive' : 'transacao-card__value--negative'}`}
          >
            {isEntrada || isTransferencia ? '' : '-'}{valorFormatado}
          </span>
          <span className={`transacao-card__badge transacao-card__badge--${transacao.tipo}`}>
            {TIPO_LABEL[transacao.tipo] || transacao.tipo}
          </span>
        </div>

        <div className="transacao-card__actions">
          {!transacao.estornada && transacao.tipo !== 'TRANSFERENCIA' && transacao.tipo !== 'PAGAMENTO_CREDITO' && (
            <button
              type="button"
              className="transacao-card__action-btn"
              onClick={() => onEstornar(transacao)}
              title="Estornar transação"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {!transacao.estornada && (
            <button
              type="button"
              className="transacao-card__action-btn transacao-card__action-btn--danger"
              onClick={() => onExcluir(transacao)}
              title="Excluir transação"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}