import { useState, FormEvent, useEffect } from 'react'
import { PagamentoFaturaRequest, TipoPagamentoFatura, Conta } from '../../../types'
import { contaService } from '../../../services/contaService'

interface PagamentoFaturaModalProps {
  onClose: () => void
  onSubmit: (data: PagamentoFaturaRequest) => Promise<void>
}

export function PagamentoFaturaModal({ onClose, onSubmit }: PagamentoFaturaModalProps) {
  const [faturaId, setFaturaId] = useState('')
  const [contaOrigemId, setContaOrigemId] = useState('')
  const [valor, setValor] = useState('')
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamentoFatura>('TOTAL')

  const [contas, setContas] = useState<Conta[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      try {
        const contasRes = await contaService.getAll()
        setContas(contasRes.data)
      } catch {
        // ignore
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!faturaId.trim()) e.faturaId = 'ID da fatura é obrigatório'
    if (!contaOrigemId) e.contaOrigemId = 'Conta origem é obrigatória'
    const v = parseFloat(valor)
    if (valor === '' || isNaN(v) || v <= 0) e.valor = 'Valor deve ser maior que zero'
    if (!tipoPagamento) e.tipoPagamento = 'Tipo de pagamento é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoadingSubmit(true)
    try {
      await onSubmit({
        faturaId: faturaId.trim(),
        contaOrigemId,
        valor: parseFloat(valor),
        tipoPagamento,
      })
    } finally {
      setLoadingSubmit(false)
    }
  }

  const tipoPagamentoLabel: Record<TipoPagamentoFatura, string> = {
    TOTAL: 'Total',
    PARCIAL: 'Parcial',
    ANTECIPADO: 'Antecipado',
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-pagamento-fatura-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-pagamento-fatura-title">Pagar Fatura</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loadingSubmit}>
            ✕
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {loadingData && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center' }}>
              Carregando dados...
            </p>
          )}

          {/* Fatura ID (hardcoded field for now) */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-id">ID da Fatura</label>
            <input
              id="pagamento-fatura-id"
              type="text"
              placeholder="Ex: fat-12345"
              value={faturaId}
              onChange={(e) => setFaturaId(e.target.value)}
              className={errors.faturaId ? 'error' : ''}
              maxLength={100}
              disabled={loadingSubmit}
            />
            {errors.faturaId && <p className="form-error">{errors.faturaId}</p>}
          </div>

          {/* Conta Origem */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-conta">Conta de Pagamento</label>
            <select
              id="pagamento-fatura-conta"
              value={contaOrigemId}
              onChange={(e) => setContaOrigemId(e.target.value)}
              className={errors.contaOrigemId ? 'error' : ''}
              disabled={loadingSubmit}
            >
              <option value="">Selecione a conta</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.contaOrigemId && <p className="form-error">{errors.contaOrigemId}</p>}
          </div>

          {/* Valor */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-valor">Valor (R$)</label>
            <input
              id="pagamento-fatura-valor"
              type="number"
              placeholder="0.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={errors.valor ? 'error' : ''}
              min="0.01"
              step="0.01"
              disabled={loadingSubmit}
            />
            {errors.valor && <p className="form-error">{errors.valor}</p>}
          </div>

          {/* Tipo de Pagamento */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-tipo">Tipo de Pagamento</label>
            <select
              id="pagamento-fatura-tipo"
              value={tipoPagamento}
              onChange={(e) => setTipoPagamento(e.target.value as TipoPagamentoFatura)}
              className={errors.tipoPagamento ? 'error' : ''}
              disabled={loadingSubmit}
            >
              {(['TOTAL', 'PARCIAL', 'ANTECIPADO'] as TipoPagamentoFatura[]).map((t) => (
                <option key={t} value={t}>{tipoPagamentoLabel[t]}</option>
              ))}
            </select>
            {errors.tipoPagamento && <p className="form-error">{errors.tipoPagamento}</p>}
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loadingSubmit}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loadingSubmit || loadingData}>
              {loadingSubmit ? 'Pagando...' : 'Pagar Fatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}