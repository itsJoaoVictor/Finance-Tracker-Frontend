import { useState, FormEvent } from 'react'
import { ContaCriacaoRequest, TipoConta } from '../../../types'

interface CreateAccountModalProps {
  onClose: () => void
  onSubmit: (data: ContaCriacaoRequest) => Promise<void>
}

export function CreateAccountModal({ onClose, onSubmit }: CreateAccountModalProps) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoConta>('CORRENTE')
  const [saldo, setSaldo] = useState('')
  const [cor, setCor] = useState('#f05a3c')
  const [contaPadrao, setContaPadrao] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!tipo) e.tipo = 'Tipo é obrigatório'
    const s = parseFloat(saldo || '0')
    if (isNaN(s)) e.saldo = 'Saldo inválido'
    else if (s < 0) e.saldo = 'Saldo não pode ser negativo'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        nome: nome.trim(),
        tipo,
        saldo: parseFloat(saldo || '0'),
        corHexadecimal: cor,
        contaPadrao,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-criar-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-criar-title">Nova Conta</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="criar-nome">Nome da Conta</label>
            <input
              id="criar-nome"
              type="text"
              placeholder="Ex: Nubank Principal"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={errors.nome ? 'error' : ''}
              maxLength={100}
            />
            {errors.nome && <p className="form-error">{errors.nome}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="criar-tipo">Tipo</label>
            <select
              id="criar-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoConta)}
              className={errors.tipo ? 'error' : ''}
            >
              <option value="CORRENTE">Conta Corrente</option>
              <option value="POUPANCA">Poupança</option>
            </select>
            {errors.tipo && <p className="form-error">{errors.tipo}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="criar-saldo">Saldo Inicial (R$)</label>
            <input
              id="criar-saldo"
              type="number"
              placeholder="0.00"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              className={errors.saldo ? 'error' : ''}
              min="0"
              step="0.01"
            />
            {errors.saldo && <p className="form-error">{errors.saldo}</p>}
          </div>

          <div className="form-group">
            <label>Cor da Conta</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="color-preview" style={{ background: cor }} />
              <input
                id="criar-cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{cor.toUpperCase()}</span>
            </div>
          </div>

          <label className="form-group form-group--checkbox" htmlFor="criar-padrao">
            <input
              id="criar-padrao"
              type="checkbox"
              checked={contaPadrao}
              onChange={(e) => setContaPadrao(e.target.checked)}
            />
            <span>Definir como conta padrão</span>
          </label>

          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading} id="btn-criar-conta">
              {loading ? 'Salvando...' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
