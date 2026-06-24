import { useState, FormEvent, useEffect } from 'react'
import { OrcamentoCriacaoRequest, OrcamentoResumo, Category } from '../../../types'
import { categoryService } from '../../../services/categoryService'
import { Toast, useToast } from '../../../components/Toast'

interface CreateOrcamentoModalProps {
  onClose: () => void
  onSubmit: (data: OrcamentoCriacaoRequest) => Promise<void>
  orcamento?: OrcamentoResumo
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function formatCurrencyForInput(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CreateOrcamentoModal({ onClose, onSubmit, orcamento }: CreateOrcamentoModalProps) {
  const isEdit = !!orcamento
  const [categoriaId, setCategoriaId] = useState(orcamento?.categoriaId || '')
  const [limiteMensal, setLimiteMensal] = useState(orcamento ? formatCurrencyForInput(orcamento.limiteMensal) : '')
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toasts, addToast, dismiss } = useToast()

  useEffect(() => {
    async function loadCategorias() {
      try {
        const res = await categoryService.getAll(true)
        setCategorias(res.data)
      } catch {
        addToast('Erro ao carregar categorias.', 'error')
      } finally {
        setLoadingCategorias(false)
      }
    }
    loadCategorias()
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!categoriaId) {
      e.categoriaId = 'Selecione uma categoria'
    }
    const valor = parseCurrencyInput(limiteMensal)
    if (!limiteMensal.trim() || valor <= 0) {
      e.limiteMensal = 'Limite deve ser maior que zero'
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
        categoriaId,
        limiteMensal: parseCurrencyInput(limiteMensal),
      })
    } catch {
      addToast('Erro ao criar orçamento.', 'error')
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
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-criar-orcamento-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-criar-orcamento-title">{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loading}>✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {/* Categoria */}
          <div className="form-group">
            <label htmlFor="criar-orcamento-categoria">Categoria</label>
            <select
              id="criar-orcamento-categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={errors.categoriaId ? 'error' : ''}
              disabled={loading || loadingCategorias}
            >
              <option value="">
                {loadingCategorias ? 'Carregando categorias...' : 'Selecione uma categoria'}
              </option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
            {errors.categoriaId && <p className="form-error">{errors.categoriaId}</p>}
          </div>

          {/* Limite Mensal */}
          <div className="form-group">
            <label htmlFor="criar-orcamento-limite">Limite Mensal</label>
            <input
              id="criar-orcamento-limite"
              type="text"
              placeholder="R$ 1.500,00"
              value={limiteMensal}
              onChange={(e) => setLimiteMensal(e.target.value)}
              className={errors.limiteMensal ? 'error' : ''}
              disabled={loading}
            />
            {errors.limiteMensal && <p className="form-error">{errors.limiteMensal}</p>}
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading} id="btn-criar-orcamento">
              {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Orçamento'}
            </button>
          </div>
        </form>
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}