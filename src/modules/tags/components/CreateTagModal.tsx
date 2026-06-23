import { useState, FormEvent } from 'react'
import { TagCriacaoRequest } from '../../../types'
import { Toast, useToast } from '../../../components/Toast'

interface CreateTagModalProps {
  onClose: () => void
  onSubmit: (data: TagCriacaoRequest) => Promise<void>
}

export function CreateTagModal({ onClose, onSubmit }: CreateTagModalProps) {
  const [nome, setNome] = useState('')
  const [corHexadecimal, setCorHexadecimal] = useState('#f05a3c')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toasts, addToast, dismiss } = useToast()

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) {
      e.nome = 'Nome é obrigatório'
    } else if (nome.length > 50) {
      e.nome = 'Nome deve ter no máximo 50 caracteres'
    }
    if (!corHexadecimal) {
      e.cor = 'Cor é obrigatória'
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(corHexadecimal)) {
      e.cor = 'Cor deve ser um hexadecimal válido'
    }
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
        corHexadecimal,
      })
    } catch {
      addToast('Erro ao criar tag.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-criar-tag-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-criar-tag-title">Nova Tag</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loading}>✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {/* Nome */}
          <div className="form-group">
            <label htmlFor="criar-tag-nome">Nome da Tag</label>
            <input
              id="criar-tag-nome"
              type="text"
              placeholder="Ex: Urgente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={errors.nome ? 'error' : ''}
              maxLength={50}
              disabled={loading}
            />
            {errors.nome && <p className="form-error">{errors.nome}</p>}
          </div>

          {/* Cor */}
          <div className="form-group form-group--color">
            <label htmlFor="criar-tag-cor">Cor da Tag</label>
            <input
              id="criar-tag-cor"
              type="color"
              value={corHexadecimal}
              onChange={(e) => setCorHexadecimal(e.target.value)}
              disabled={loading}
            />
            <span className="color-preview" style={{ backgroundColor: corHexadecimal }} />
            {errors.cor && <p className="form-error">{errors.cor}</p>}
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading} id="btn-criar-tag">
              {loading ? 'Salvando...' : 'Criar Tag'}
            </button>
          </div>
        </form>
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}