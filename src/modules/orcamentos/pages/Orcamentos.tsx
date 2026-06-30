import { useEffect, useState, useCallback, useRef } from 'react'
import { OrcamentoResumo, OrcamentoCriacaoRequest } from '../../../types'
import { orcamentoService } from '../../../services/orcamentoService'
import { CreateOrcamentoModal } from '../components/CreateOrcamentoModal'
import { Toast, useToast } from '../../../components/Toast'
import '../orcamentos.css'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editOrcamento, setEditOrcamento] = useState<OrcamentoResumo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OrcamentoResumo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toasts, addToast, dismiss } = useToast()

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!openMenuId) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    // Usa setTimeout para não fechar imediatamente no mesmo click que abriu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const loadOrcamentos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orcamentoService.resumo()
      setOrcamentos(res.data)
    } catch {
      addToast('Erro ao carregar orçamentos.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrcamentos()
  }, [loadOrcamentos])

  // ─── Criar ───────────────────────────────────────────────────
  async function handleCreate(data: OrcamentoCriacaoRequest) {
    try {
      await orcamentoService.criarOuAtualizar(data)
      setShowCreate(false)
      addToast('Orçamento criado com sucesso!', 'success')
      await loadOrcamentos()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar orçamento.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Editar ───────────────────────────────────────────────────
  async function handleEdit(data: OrcamentoCriacaoRequest) {
    if (!editOrcamento) return
    try {
      await orcamentoService.editar(editOrcamento.id, data)
      setEditOrcamento(null)
      addToast('Orçamento atualizado com sucesso!', 'success')
      await loadOrcamentos()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar orçamento.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir ──────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await orcamentoService.excluir(deleteTarget.id)
      setDeleteTarget(null)
      addToast('Orçamento excluído com sucesso!', 'success')
      await loadOrcamentos()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir orçamento.'
      addToast(msg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function getStatusClass(percentual: number): string {
    if (percentual >= 100) return 'orcamentos-status--danger'
    if (percentual >= 80) return 'orcamentos-status--warning'
    return 'orcamentos-status--ok'
  }

  return (
    <div className="orcamentos-page">
      {/* Header */}
      <div className="orcamentos-header">
        <button
          className="btn-novo-orcamento"
          onClick={() => setShowCreate(true)}
          id="btn-novo-orcamento"
        >
          + Novo Orçamento
        </button>
      </div>

      {/* Tabela de Orçamentos */}
      {loading && orcamentos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Carregando orçamentos...
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="orcamentos-empty">
          <p>Nenhum orçamento definido. Crie seu primeiro orçamento!</p>
        </div>
      ) : (
        <div className="orcamentos-table-wrapper">
          <table className="orcamentos-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Limite Mensal</th>
                <th>Total Gasto</th>
                <th>Progresso</th>
                <th className="orcamentos-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orc) => {
                const percentual = orc.limiteMensal > 0
                  ? Math.min((orc.totalGasto / orc.limiteMensal) * 100, 100)
                  : 0
                const statusClass = getStatusClass(percentual)
                const isMenuOpen = openMenuId === orc.id

                return (
                  <tr key={orc.categoriaId}>
                    <td className="orcamentos-td-category">
                      <span className="orcamentos-category-dot" style={{
                        background: percentual >= 100 ? '#e03a2a' : percentual >= 80 ? '#d4a017' : '#2c9040'
                      }} />
                      {orc.categoriaNome}
                    </td>
                    <td className="orcamentos-td-value">{formatCurrency(orc.limiteMensal)}</td>
                    <td className="orcamentos-td-value">{formatCurrency(orc.totalGasto)}</td>
                    <td className="orcamentos-progress-cell">
                      <div className="orcamentos-progress-track">
                        <div
                          className="orcamentos-progress-fill"
                          style={{
                            width: `${percentual}%`,
                            backgroundColor:
                              percentual >= 100 ? '#e03a2a' : percentual >= 80 ? '#d4a017' : '#2c9040',
                          }}
                        />
                      </div>
                      <div className={`orcamentos-progress-label ${statusClass}`}>
                        {percentual.toFixed(1)}%
                      </div>
                    </td>
                    <td className="orcamentos-td-actions">
                      <div className="orcamentos-actions-cell" ref={isMenuOpen ? dropdownRef : undefined}>
                        <button
                          type="button"
                          className="orcamentos-menu-btn"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : orc.id)}
                          aria-label="Mais opções"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                        {isMenuOpen && (
                          <div className="orcamentos-dropdown">
                            <button
                              type="button"
                              className="orcamentos-dropdown__item"
                              onClick={() => {
                                setOpenMenuId(null)
                                setEditOrcamento(orc)
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="orcamentos-dropdown__item orcamentos-dropdown__item--danger"
                              onClick={() => {
                                setOpenMenuId(null)
                                setDeleteTarget(orc)
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreate && (
        <CreateOrcamentoModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Modal de Edição */}
      {editOrcamento && (
        <CreateOrcamentoModal
          onClose={() => setEditOrcamento(null)}
          onSubmit={handleEdit}
          orcamento={editOrcamento}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null)
          }}
        >
          <div className="modal orcamentos-confirm-modal" role="dialog" aria-modal="true">
            <div className="orcamentos-confirm-modal__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e03a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="orcamentos-confirm-modal__title">Excluir orçamento?</h3>
            <p className="orcamentos-confirm-modal__text">
              O limite de <strong>{deleteTarget.categoriaNome}</strong> será removido permanentemente.
            </p>
            <div className="orcamentos-confirm-modal__actions">
              <button
                type="button"
                className="orcamentos-confirm-modal__btn orcamentos-confirm-modal__btn--cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Manter
              </button>
              <button
                type="button"
                className="orcamentos-confirm-modal__btn orcamentos-confirm-modal__btn--delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="orcamentos-confirm-modal__spinner" />
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
