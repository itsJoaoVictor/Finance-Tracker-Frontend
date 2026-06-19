import { useEffect, useState, useCallback } from 'react'
import { Categoria, CategoriaRequest } from '../../../types'
import { categoriaService } from '../../../services/categoriaService'
import { CategoryIcon } from '../../../components/CategoryIcon'
import { CreateCategoryModal } from '../components/CreateCategoryModal'
import { EditCategoryModal } from '../components/EditCategoryModal'
import { Toast, useToast } from '../../contas/components/Toast'
import '../categorias.css'

export function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarInativas, setMostrarInativas] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editCategoria, setEditCategoria] = useState<Categoria | null>(null)
  const { toasts, addToast, dismiss } = useToast()

  const loadCategorias = useCallback(async () => {
    setLoading(true)
    try {
      // Se mostrarInativas for true, passamos somenteAtivas = false (para carregar todas)
      // Se mostrarInativas for false, passamos somenteAtivas = true (para carregar apenas ativas)
      const res = await categoriaService.getAll(!mostrarInativas)
      setCategorias(res.data)
    } catch {
      addToast('Erro ao carregar categorias.', 'error')
    } finally {
      setLoading(false)
    }
  }, [mostrarInativas])

  useEffect(() => {
    loadCategorias()
  }, [loadCategorias])

  // ─── Criar Categoria ──────────────────────────────────────────
  async function handleCreate(data: CategoriaRequest) {
    try {
      const res = await categoriaService.create(data)
      setCategorias((prev) => [...prev, res.data])
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
  async function handleEdit(id: string, data: CategoriaRequest) {
    const previous = categorias
    // Optimistic update
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    )
    setEditCategoria(null)
    try {
      const res = await categoriaService.update(id, data)
      setCategorias((prev) => prev.map((c) => (c.id === id ? res.data : c)))
      addToast('Categoria atualizada com sucesso!', 'success')
    } catch (err: unknown) {
      setCategorias(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar categoria.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Inativar Categoria (Optimistic UI) ───────────────────────
  async function handleDelete(categoria: Categoria) {
    if (!window.confirm(`Tem certeza que deseja inativar a categoria "${categoria.nome}"?`)) return
    const previous = categorias
    // Optimistic update: se não estiver mostrando inativas, removemos da lista. Se estiver mostrando, marcamos como inativa.
    setCategorias((prev) =>
      mostrarInativas
        ? prev.map((c) => (c.id === categoria.id ? { ...c, ativo: false } : c))
        : prev.filter((c) => c.id !== categoria.id)
    )
    try {
      await categoriaService.softDelete(categoria.id)
      addToast('Categoria inativada com sucesso!', 'success')
    } catch (err: unknown) {
      setCategorias(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao inativar categoria.'
      addToast(msg, 'error')
    }
  }

  // ─── Reativar Categoria (Optimistic UI) ───────────────────────
  async function handleReactivate(categoria: Categoria) {
    const previous = categorias
    setCategorias((prev) =>
      prev.map((c) => (c.id === categoria.id ? { ...c, ativo: true } : c))
    )
    try {
      await categoriaService.ativar(categoria.id)
      addToast('Categoria reativada com sucesso!', 'success')
    } catch (err: unknown) {
      setCategorias(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao reativar categoria.'
      addToast(msg, 'error')
    }
  }

  return (
    <div className="categorias-page">
      <div className="categorias-header">
        <div>
          <h1 className="categorias-header__title">Categorias</h1>
          <p className="categorias-header__subtitle">
            Gerencie as categorias de classificação dos seus lançamentos
          </p>
        </div>
        <button
          className="btn-nova-categoria"
          onClick={() => setShowCreate(true)}
        >
          <span>+ Nova Categoria</span>
        </button>
      </div>

      <div className="categorias-controls">
        <div 
          className="toggle-switch-container"
          onClick={() => setMostrarInativas(!mostrarInativas)}
        >
          <div className={`toggle-switch ${mostrarInativas ? 'toggle-switch--active' : ''}`}>
            <div className="toggle-switch__circle" />
          </div>
          <span>Mostrar Inativas</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          {categorias.length} {categorias.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
        </span>
      </div>

      {loading && categorias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          Carregando categorias...
        </div>
      ) : (
        <div className="category-grid">
          {categorias.map((c) => (
            <div 
              key={c.id} 
              className={`category-card ${!c.ativo ? 'category-card--inactive' : ''}`}
            >
              <div className="category-card__header">
                <div 
                  className="category-card__icon-wrapper"
                  style={{ backgroundColor: `${c.corHexadecimal}15` }}
                >
                  <CategoryIcon name={c.icone} color={c.corHexadecimal} size={22} />
                </div>
                {c.usuarioId === null ? (
                  <span className="category-card__badge category-card__badge--system">Sistema</span>
                ) : !c.ativo ? (
                  <span className="category-card__badge category-card__badge--inactive">Inativa</span>
                ) : (
                  <span className="category-card__badge">Personalizada</span>
                )}
              </div>
              <div className="category-card__body">
                <h3 className="category-card__title">{c.nome}</h3>
              </div>
              
              {c.usuarioId !== null && (
                <div className="category-card__footer">
                  {c.ativo ? (
                    <>
                      <button 
                        className="btn-card-action btn-card-action--edit"
                        onClick={() => setEditCategoria(c)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn-card-action btn-card-action--delete"
                        onClick={() => handleDelete(c)}
                      >
                        Inativar
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn-card-action btn-card-action--reactivate"
                      onClick={() => handleReactivate(c)}
                    >
                      Reativar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCategoryModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editCategoria && (
        <EditCategoryModal
          categoria={editCategoria}
          onClose={() => setEditCategoria(null)}
          onSubmit={(data) => handleEdit(editCategoria.id, data)}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
