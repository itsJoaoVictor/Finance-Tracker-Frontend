import { useState, FormEvent, useEffect } from 'react'
import { TransferenciaRequest, Conta } from '../../../types'
import { contaService } from '../../../services/contaService'

interface TransferenciaModalProps {
  onClose: () => void
  onSubmit: (data: TransferenciaRequest) => Promise<void>
}

export function TransferenciaModal({ onClose, onSubmit }: TransferenciaModalProps) {
  const [contaOrigemId, setContaOrigemId] = useState('')
  const [contaDestinoId, setContaDestinoId] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')

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
    if (!contaOrigemId) e.contaOrigemId = 'Conta origem é obrigatória'
    if (!contaDestinoId) e.contaDestinoId = 'Conta destino é obrigatória'
    if (contaOrigemId && contaDestinoId && contaOrigemId === contaDestinoId) {
      e.contaDestinoId = 'Conta destino deve ser diferente da origem'
    }
    const v = parseFloat(valor)
    if (valor === '' || isNaN(v) || v <= 0) e.valor = 'Valor deve ser maior que zero'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoadingSubmit(true)
    try {
      await onSubmit({
        contaOrigemId,
        contaDestinoId,
        valor: parseFloat(valor),
        descricao: descricao.trim() || undefined,
        categoriaId: undefined,
      })
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-transferencia-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-transferencia-title">Transferir entre Contas</h2>
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

          {/* Conta Origem */}
          <div className="form-group">
            <label htmlFor="transferencia-conta-origem">Conta Origem</label>
            <select
              id="transferencia-conta-origem"
              value={contaOrigemId}
              onChange={(e) => setContaOrigemId(e.target.value)}
              className={errors.contaOrigemId ? 'error' : ''}
              disabled={loadingSubmit}
            >
              <option value="">Selecione a conta de origem</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.contaOrigemId && <p className="form-error">{errors.contaOrigemId}</p>}
          </div>

          {/* Conta Destino */}
          <div className="form-group">
            <label htmlFor="transferencia-conta-destino">Conta Destino</label>
            <select
              id="transferencia-conta-destino"
              value={contaDestinoId}
              onChange={(e) => setContaDestinoId(e.target.value)}
              className={errors.contaDestinoId ? 'error' : ''}
              disabled={loadingSubmit}
            >
              <option value="">Selecione a conta de destino</option>
              {contas
                .filter((c) => c.id !== contaOrigemId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
            </select>
            {errors.contaDestinoId && <p className="form-error">{errors.contaDestinoId}</p>}
          </div>

          {/* Valor */}
          <div className="form-group">
            <label htmlFor="transferencia-valor">Valor (R$)</label>
            <input
              id="transferencia-valor"
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

          {/* Descrição */}
          <div className="form-group">
            <label htmlFor="transferencia-descricao">Descrição (opcional)</label>
            <input
              id="transferencia-descricao"
              type="text"
              placeholder="Ex: Pagamento de aluguel"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={200}
              disabled={loadingSubmit}
            />
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loadingSubmit}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loadingSubmit || loadingData}>
              {loadingSubmit ? 'Transferindo...' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}