import { useEffect, useState, useCallback } from 'react'
import { Conta, ContaCriacaoRequest, ContaEdicaoRequest } from '../../../types'
import { contaService } from '../../../services/contaService'
import { AccountList } from '../components/AccountList'
import { CreateAccountModal } from '../components/CreateAccountModal'
import { EditAccountModal } from '../components/EditAccountModal'
import { Toast, useToast } from '../components/Toast'
import '../contas.css'

export function Contas() {
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSaldo, setTotalSaldo] = useState<number>(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editConta, setEditConta] = useState<Conta | null>(null)
  const { toasts, addToast, dismiss } = useToast()

  const loadContas = useCallback(async () => {
    setLoading(true)
    try {
      const [contasRes, resumoRes] = await Promise.all([
        contaService.getAll(),
        contaService.getResumo(),
      ])
      setContas(contasRes.data)
      setTotalSaldo(resumoRes.data.totalSaldo)
    } catch {
      addToast('Erro ao carregar contas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContas()
  }, [loadContas])

  // ─── Criar ───────────────────────────────────────────────────
  async function handleCreate(data: ContaCriacaoRequest) {
    try {
      const res = await contaService.create(data)
      const nova = res.data
      // RN-04: se nova é padrão, remover padrão das outras
      setContas((prev) => {
        const updated = nova.contaPadrao
          ? prev.map((c) => ({ ...c, contaPadrao: false }))
          : prev
        return [...updated, nova]
      })
      setTotalSaldo((prev) => prev + nova.saldo)
      setShowCreate(false)
      addToast('Conta criada com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar conta.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Editar (Optimistic UI) ───────────────────────────────────
  async function handleEdit(id: string, data: ContaEdicaoRequest) {
    const previous = contas
    // Optimistic update
    setContas((prev) => {
      if (data.contaPadrao) {
        return prev.map((c) => ({ ...c, contaPadrao: c.id === id, ...(c.id === id ? data : {}) }))
      }
      return prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    })
    setEditConta(null)
    try {
      const res = await contaService.update(id, data)
      // Substituir com dados reais do servidor
      setContas((prev) => prev.map((c) => (c.id === id ? res.data : c)))
      addToast('Conta atualizada com sucesso!', 'success')
    } catch (err: unknown) {
      setContas(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar conta.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir (Optimistic UI) ──────────────────────────────────
  async function handleDelete(conta: Conta) {
    if (!window.confirm(`Excluir a conta "${conta.nome}"?`)) return
    const previous = contas
    // Optimistic remove
    setContas((prev) => prev.filter((c) => c.id !== conta.id))
    setTotalSaldo((prev) => prev - conta.saldo)
    try {
      await contaService.softDelete(conta.id)
      addToast('Conta excluída com sucesso!', 'success')
    } catch (err: unknown) {
      setContas(previous)
      setTotalSaldo((prev) => prev + conta.saldo)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir conta.'
      addToast(msg, 'error')
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="contas-page">
      {/* Header */}
      <div className="contas-header">
        <div>
          <h1 className="contas-header__title">Minhas Contas</h1>
          <p className="contas-header__subtitle">Gerencie seus repositórios financeiros</p>
        </div>
        <button
          className="btn-nova-conta"
          onClick={() => setShowCreate(true)}
          id="btn-nova-conta"
        >
          + Nova Conta
        </button>
      </div>

      {/* Resumo */}
      <div className="contas-resumo">
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Saldo Total</span>
          <span
            className={`contas-resumo__value ${totalSaldo >= 0 ? 'contas-resumo__value--green' : ''}`}
          >
            {loading ? '...' : formatCurrency(totalSaldo)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Contas Ativas</span>
          <span className="contas-resumo__value">{loading ? '...' : contas.length}</span>
        </div>
      </div>

      {/* Lista de contas */}
      <AccountList
        contas={contas}
        loading={loading}
        onEdit={setEditConta}
        onDelete={handleDelete}
      />

      {/* Modais */}
      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editConta && (
        <EditAccountModal
          conta={editConta}
          onClose={() => setEditConta(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
