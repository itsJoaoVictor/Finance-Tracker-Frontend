import React, { useState } from 'react'
import { Transacao } from '../../../types'
import { transacaoService } from '../../../services/transacaoService'

interface AnteciparParcelasModalProps {
  transacao: Transacao
  onClose: () => void
  onSuccess: () => void
}

export function AnteciparParcelasModal({ transacao, onClose, onSuccess }: AnteciparParcelasModalProps) {
  const [quantidade, setQuantidade] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Ex. If it's 2/10, they can anticipate up to 8 remaining installments.
  // Wait, if they are anticipating from the current fatura view, 
  // they can anticipate anything from 1 to totalParcelas - numeroParcela
  const maxQuantidade = (transacao.totalParcelas || 1) - (transacao.numeroParcela || 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantidade < 1 || quantidade > maxQuantidade) {
      setError(`Selecione um valor entre 1 e ${maxQuantidade}`)
      return
    }

    setLoading(true)
    setError('')
    try {
      await transacaoService.anteciparParcelas(transacao.id, { quantidade })
      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Erro ao antecipar parcelas')
    } finally {
      setLoading(false)
    }
  }

  // Formata o valor como moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const valorAdicional = quantidade * (transacao.valor || 0)

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div 
        className="modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-antecipar-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="modal-antecipar-title">Antecipar Parcelas</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loading}>
            ✕
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div style={{ padding: '0 4px' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              A transação <strong>{transacao.descricao}</strong> tem {maxQuantidade} parcela(s) restante(s).
            </p>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              As parcelas selecionadas serão trazidas para a <strong>fatura aberta do mês atual</strong>. O total da sua dívida terminará mais cedo.
            </p>

            {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="form-group">
              <label htmlFor="quantidade">Quantidade de parcelas para antecipar (Máx: {maxQuantidade})</label>
              <input
                type="number"
                id="quantidade"
                min="1"
                max={maxQuantidade}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                placeholder={`1 a ${maxQuantidade}`}
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            {quantidade > 0 && quantidade <= maxQuantidade && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Valor adicionado à fatura atual:</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--danger)' }}>
                  +{formatCurrency(valorAdicional)}
                </strong>
              </div>
            )}
          </div>

          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading || maxQuantidade < 1}>
              {loading ? 'Antecipando...' : 'Antecipar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
