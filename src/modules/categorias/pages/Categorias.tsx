import { useEffect, useState, useCallback } from 'react'
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '../../../types'
import { categoryService } from '../../../services/categoryService'
import { CategoryIcon } from '../../../components/CategoryIcon'
import { CreateCategoryModal } from '../components/CreateCategoryModal'
import { EditCategoryModal } from '../components/EditCategoryModal'
import { Toast, useToast } from '../../contas/components/Toast' // reuse toast component
import '../categorias.css'

export function Categorias() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [somenteAtivas, setSomenteAtivas] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const { toasts, addToast, dismiss } = useToast()

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await categoryService.getAll(somenteAtivas)
      setCategories(res.data)
    } catch {
      addToast('Erro ao carregar categorias.', 'error')
    } finally {
      setLoading(false)
    }
  }, [somenteAtivas])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // ─── Criar Categoria ─────────────────────────────────────────
  async function handleCreate(data: CategoryCreateRequest) {
    try {
      const res = await categoryService.create(data)
      setCategories((prev) => [...prev, res.data])
      setShowCreate(false)
      addToast('Categoria criada com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar categoria.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Editar Categoria (Optimistic UI) ─────────────────────────
  async function handleEdit(id: string, data: CategoryUpdateRequest) {
    const previous = categories
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    )
    setEditCategory(null)
    try {
      const res = await categoryService.update(id, data)
      setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)))
      addToast('Categoria atualizada com sucesso!', 'success')
    } catch (err: unknown) {
      setCategories(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar categoria.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir Categoria (Soft Delete / Optimistic UI) ──────────
  async function handleDelete(category: Category) {
    if (!window.confirm(`Inativar a categoria "${category.nome}"?`)) return
    const previous = categories
    
    // If somenteAtivas is true, remove it from list. If false, set active = false.
    setCategories((prev) =>
      somenteAtivas
        ? prev.filter((c) => c.id !== category.id)
        : prev.map((c) => (c.id === category.id ? { ...c, ativo: false } : c))
    )
    try {
      await categoryService.softDelete(category.id)
      addToast('Categoria inativada com sucesso!', 'success')
    } catch (err: unknown) {
      setCategories(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao inativar categoria.'
      addToast(msg, 'error')
    }
  }

  // ─── Excluir Permanentemente (Hard Delete) ────────────────────
  async function handlePermanentDelete(category: Category) {
    if (!window.confirm(`Tem certeza que deseja excluir PERMANENTEMENTE a categoria "${category.nome}"? Esta ação não pode ser desfeita.`)) return
    const previous = categories
    setCategories((prev) => prev.filter((c) => c.id !== category.id))
    try {
      await categoryService.hardDelete(category.id)
      addToast('Categoria excluída permanentemente!', 'success')
    } catch (err: unknown) {
      setCategories(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir categoria permanentemente.'
      addToast(msg, 'error')
    }
  }

  // ─── Reativar Categoria (Optimistic UI) ───────────────────────
  async function handleReactivate(category: Category) {
    const previous = categories
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, ativo: true } : c))
    )
    try {
      await categoryService.ativar(category.id)
      addToast('Categoria reativada com sucesso!', 'success')
    } catch (err: unknown) {
      setCategories(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao reativar categoria.'
      addToast(msg, 'error')
    }
  }

  const globalCategories = categories.filter((c) => c.usuarioId === null)
  const customCategories = categories.filter((c) => c.usuarioId !== null)

  return (
    <div className="categorias-page">
      {/* Header */}
      <div className="categorias-header">
        <div>
          <h1 className="categorias-header__title">Categorias</h1>
          <p className="categorias-header__subtitle">Classifique e gerencie suas despesas e receitas</p>
        </div>
        
        <div className="categorias-header__actions">
          <label className="toggle-filter" id="toggle-inativas">
            <input
              type="checkbox"
              checked={!somenteAtivas}
              onChange={(e) => setSomenteAtivas(!e.target.checked)}
            />
            <div className="toggle-filter__track">
              <div className="toggle-filter__thumb" />
            </div>
            <span>Mostrar Inativas</span>
          </label>

          <button
            className="btn-nova-categoria"
            onClick={() => setShowCreate(true)}
            id="btn-nova-categoria"
          >
            + Nova Categoria
          </button>
        </div>
      </div>

      {/* Grid das Categorias */}
      {loading && categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Carregando categorias...
        </div>
      ) : (
        <div className="categorias-sections">
          {/* Categorias Customizadas */}
          <div className="categorias-section">
            <h3 className="categorias-section__title">Minhas Categorias</h3>
            {customCategories.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)', padding: '12px 0' }}>
                Nenhuma categoria personalizada criada.
              </p>
            ) : (
              <div className="categorias-grid">
                {customCategories.map((c) => (
                  <div
                    key={c.id}
                    className={`categoria-card ${!c.ativo ? 'categoria-card--inativa' : ''}`}
                  >
                    <div className="categoria-card__info">
                      <div
                        className="categoria-card__icon-wrapper"
                        style={{ background: `${c.corHexadecimal}15` }}
                      >
                        <CategoryIcon name={c.icone} color={c.corHexadecimal} size={20} />
                      </div>
                      <div className="categoria-card__details">
                        <p className="categoria-card__name">{c.nome}</p>
                        <p className="categoria-card__type">
                          {c.ativo ? 'Personalizada' : 'Inativa'}
                        </p>
                      </div>
                    </div>

                    <div className="categoria-card__actions">
                      {c.ativo ? (
                        <>
                          {/* Editar */}
                          <button
                            type="button"
                            className="categoria-card__btn"
                            onClick={() => setEditCategory(c)}
                            title="Editar Categoria"
                          >
                            ✎
                          </button>
                          {/* Excluir (Soft delete) */}
                          <button
                            type="button"
                            className="categoria-card__btn categoria-card__btn--delete"
                            onClick={() => handleDelete(c)}
                            title="Inativar Categoria"
                          >
                            ✕
                          </button>
                          {/* Excluir permanentemente */}
                          <button
                            type="button"
                            className="categoria-card__btn categoria-card__btn--delete"
                            onClick={() => handlePermanentDelete(c)}
                            title="Excluir Permanentemente"
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Reativar */}
                          <button
                            type="button"
                            className="categoria-card__btn categoria-card__btn--reactivate"
                            onClick={() => handleReactivate(c)}
                            title="Reativar Categoria"
                            style={{ fontSize: '1.1rem' }}
                          >
                            ↺
                          </button>
                          {/* Excluir permanentemente */}
                          <button
                            type="button"
                            className="categoria-card__btn categoria-card__btn--delete"
                            onClick={() => handlePermanentDelete(c)}
                            title="Excluir Permanentemente"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categorias Globais */}
          <div className="categorias-section">
            <h3 className="categorias-section__title">Categorias Padrão (Sistema)</h3>
            <div className="categorias-grid">
              {globalCategories.map((c) => (
                <div key={c.id} className="categoria-card">
                  <div className="categoria-card__info">
                    <div
                      className="categoria-card__icon-wrapper"
                      style={{ background: `${c.corHexadecimal}15` }}
                    >
                      <CategoryIcon name={c.icone} color={c.corHexadecimal} size={20} />
                    </div>
                    <div className="categoria-card__details">
                      <p className="categoria-card__name">{c.nome}</p>
                      <p className="categoria-card__type">Sistema</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modais */}
      {showCreate && (
        <CreateCategoryModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editCategory && (
        <EditCategoryModal
          categoria={editCategory}
          onClose={() => setEditCategory(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
