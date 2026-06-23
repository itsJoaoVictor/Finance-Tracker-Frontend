import { useState, FormEvent, useEffect } from 'react'
import { MetaEconomiaCriacaoRequest, Conta } from '../../../types'
import { contaService } from '../../../services/contaService'
import { Toast, useToast } from '../../../components/Toast'

interface CreateMetaModalProps {
  onClose: () => void
  onSubmit: (data: MetaEconomiaCriacaoRequest) => Promise<void>
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function CreateMetaModal({ onClose, onSubmit }: CreateMetaModalProps) {
  const [nome, setNome] = useState('')
  const [valorAlvo, setValorAlvo] = useState('')
  const [contaVinculadaId, setContaVinculadaId] = useState('')
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingContas, setLoadingContas] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toasts, addToast, dismiss } = useToast()

  useEffect(() => {
    async function loadContas() {
      try {
        const res = await contaService.getAll()
        setContas(res.data)
      } catch {
        addToast('Erro ao carregar contas.', 'error')
      } finally {
        setLoadingContas(false)
      }
    }
    loadContas()
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) {
      e.nome = 'Nome é obrigatório'
    }
    const valor = parseCurrencyInput(valorAlvo)
    if (!valorAlvo.trim() || valor <= 0) {
      e.valorAlvo = 'Valor alvo deve ser maior que zero'
    }
    if (!contaVinculadaId) {
      e.contaVinculadaId = 'Selecione uma conta'
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
        valorAlvo: parseCurrencyInput(valorAlvo),
        contaVinculadaId,
      })
    } catch {
      addToast('Erro ao criar cofrinho.', 'error')
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-criar-meta-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-criar-meta-title">Novo Cofrinho</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loading}>✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {/* Nome */}
          <div className="form-group">
            <label htmlFor="criar-meta-nome">Nome do Cofrinho</label>
            <input
              id="criar-meta-nome"
              type="text"
              placeholder="Ex: Viagem para Europa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={errors.nome ? 'error' : ''}
              disabled={loading}
            />
            {errors.nome && <p className="form-error">{errors.nome}</p>}
          </div>

          {/* Valor Alvo */}
          <div className="form-group">
            <label htmlFor="criar-meta-valor">Valor Alvo</label>
            <input
              id="criar-meta-valor"
              type="text"
              placeholder="R$ 10.000,00"
              value={valorAlvo}
              onChange={(e) => setValorAlvo(e.target.value)}
              className={errors.valorAlvo ? 'error' : ''}
              disabled={loading}
            />
            {errors.valorAlvo && <p className="form-error">{errors.valorAlvo}</p>}
          </div>

          {/* Conta Vinculada */}
          <div className="form-group">
            <label htmlFor="criar-meta-conta">Conta Vinculada</label>
            <select
              id="criar-meta-conta"
              value={contaVinculadaId}
              onChange={(e) => setContaVinculadaId(e.target.value)}
              className={errors.contaVinculadaId ? 'error' : ''}
              disabled={loading || loadingContas}
            >
              <option value="">
                {loadingContas ? 'Carregando contas...' : 'Selecione uma conta'}
              </option>
              {contas.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome}
                </option>
              ))}
            </select>
            {errors.contaVinculadaId && <p className="form-error">{errors.contaVinculadaId}</p>}
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading} id="btn-criar-meta">
              {loading ? 'Salvando...' : 'Criar Cofrinho'}
            </button>
          </div>
        </form>
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}