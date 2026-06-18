import { useState, FormEvent } from 'react'
import { Conta, ContaEdicaoRequest, TipoConta } from '../../../types'

interface EditAccountModalProps {
  conta: Conta
  onClose: () => void
  onSubmit: (id: string, data: ContaEdicaoRequest) => Promise<void>
}

export function EditAccountModal({ conta, onClose, onSubmit }: EditAccountModalProps) {
  const [nome, setNome] = useState(conta.nome)
  const [tipo, setTipo] = useState<TipoConta>(conta.tipo)
  const [cor, setCor] = useState(conta.corHexadecimal || '#f05a3c')
  const [contaPadrao, setContaPadrao] = useState(conta.contaPadrao)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!tipo) e.tipo = 'Tipo é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(conta.id, {
        nome: nome.trim(),
        tipo,
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-editar-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-editar-title">Editar Conta</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="editar-nome">Nome da Conta</label>
            <input
              id="editar-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={errors.nome ? 'error' : ''}
              maxLength={100}
            />
            {errors.nome && <p className="form-error">{errors.nome}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="editar-tipo">Tipo</label>
            <select
              id="editar-tipo"
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
            <label>Cor da Conta</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="color-preview" style={{ background: cor }} />
              <input
                id="editar-cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{cor.toUpperCase()}</span>
            </div>
          </div>

          <label className="form-group form-group--checkbox" htmlFor="editar-padrao">
            <input
              id="editar-padrao"
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
            <button type="submit" className="btn-submit" disabled={loading} id="btn-editar-conta">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
