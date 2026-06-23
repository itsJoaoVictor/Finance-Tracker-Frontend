import { useEffect, useState, useCallback } from 'react'
import { MetaEconomia, MetaEconomiaCriacaoRequest } from '../../../types'
import { metasService } from '../../../services/metasService'
import { GoalProgressBar } from '../components/GoalProgressBar'
import { CreateMetaModal } from '../components/CreateMetaModal'
import { Toast, useToast } from '../../../components/Toast'
import '../metas.css'

export function Metas() {
  const [metas, setMetas] = useState<MetaEconomia[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const { toasts, addToast, dismiss } = useToast()

  const loadMetas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await metasService.getAll()
      setMetas(res.data)
    } catch {
      addToast('Erro ao carregar cofrinhos.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMetas()
  }, [loadMetas])

  // ─── Criar Meta ────────────────────────────────────────────────
  async function handleCreate(data: MetaEconomiaCriacaoRequest) {
    try {
      const res = await metasService.create(data)
      setMetas((prev) => [...prev, res.data])
      setShowCreate(false)
      addToast('Cofrinho criado com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar cofrinho.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir Meta ──────────────────────────────────────────────
  async function handleDelete(meta: MetaEconomia) {
    if (!window.confirm(`Excluir o cofrinho "${meta.nome}"?`)) return
    const previous = metas
    setMetas((prev) => prev.filter((m) => m.id !== meta.id))
    try {
      await metasService.excluir(meta.id)
      addToast('Cofrinho excluído com sucesso!', 'success')
    } catch (err: unknown) {
      setMetas(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir cofrinho.'
      addToast(msg, 'error')
    }
  }

  return (
    <div className="metas-page">
      {/* Header */}
      <div className="metas-header">
        <div>
          <h1 className="metas-header__title">Cofrinhos</h1>
          <p className="metas-header__subtitle">Metas de economia para realizar seus sonhos</p>
        </div>
        <button
          className="btn-nova-meta"
          onClick={() => setShowCreate(true)}
          id="btn-nova-meta"
        >
          + Novo Cofrinho
        </button>
      </div>

      {/* Grid de Metas */}
      {loading && metas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Carregando cofrinhos...
        </div>
      ) : metas.length === 0 ? (
        <div className="metas-empty">
          <p>Nenhum cofrinho cadastrado. Crie sua primeira meta!</p>
        </div>
      ) : (
        <div className="metas-grid">
          {metas.map((meta) => (
            <GoalProgressBar
              key={meta.id}
              nomeMeta={meta.nome}
              valorAlvo={meta.valorAlvo}
              valorAcumulado={meta.valorAcumulado}
              corHexadecimal="#f05a3c"
              onDelete={() => handleDelete(meta)}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {showCreate && (
        <CreateMetaModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}