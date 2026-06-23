import { useEffect, useState, useCallback } from 'react'
import { Transacao, TransacaoCriacaoRequest, TransferenciaRequest, PagamentoFaturaRequest, TipoTransacao } from '../../../types'
import { transacaoService } from '../../../services/transacaoService'
import { Toast, useToast } from '../../../components/Toast'
import { TransacaoCard } from '../components/TransacaoCard'
import { CreateTransacaoModal } from '../components/CreateTransacaoModal'
import { TransferenciaModal } from '../components/TransferenciaModal'
import { PagamentoFaturaModal } from '../components/PagamentoFaturaModal'
import { ProjecaoModal } from '../components/ProjecaoModal'
import { ArrowLeftRight, CreditCard, TrendingUp, Plus } from 'lucide-react'
import '../transacoes.css'

type TipoFiltro = 'ALL' | TipoTransacao

const TIPO_FILTER_OPTIONS: { value: TipoFiltro; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'DEPOSITO', label: 'Depósitos' },
  { value: 'SAQUE', label: 'Saques' },
  { value: 'PIX', label: 'Pix' },
  { value: 'COMPRA_CREDITO', label: 'Compra no Crédito' },
  { value: 'TRANSFERENCIA', label: 'Transferências' },
]

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('ALL')
  const [filtroDataInicio, setFiltroDataInicio] = useState(getMonthRange().start)
  const [filtroDataFim, setFiltroDataFim] = useState(getMonthRange().end)
  const [filtroDescricao, setFiltroDescricao] = useState('')

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showTransferencia, setShowTransferencia] = useState(false)
  const [showPagamentoFatura, setShowPagamentoFatura] = useState(false)
  const [showProjecao, setShowProjecao] = useState(false)

  const { toasts, addToast, dismiss } = useToast()

  // ─── Load transacoes ──────────────────────────────────────────
  const loadTransacoes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transacaoService.getAll()
      setTransacoes(res.data)
    } catch {
      addToast('Erro ao carregar transações.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransacoes()
  }, [loadTransacoes])

  // ─── Filtragem local ─────────────────────────────────────────
  const filtered = transacoes.filter((t) => {
    if (filtroTipo !== 'ALL' && t.tipo !== filtroTipo) return false
    if (filtroDescricao.trim()) {
      const q = filtroDescricao.toLowerCase().trim()
      if (!t.descricao.toLowerCase().includes(q)) return false
    }
    if (filtroDataInicio && t.data < filtroDataInicio) return false
    if (filtroDataFim && t.data > filtroDataFim) return false
    return true
  })

  // Ordenar por data decrescente
  const sorted = [...filtered].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // ─── Criar Transação ──────────────────────────────────────────
  async function handleCreate(data: TransacaoCriacaoRequest) {
    try {
      const res = await transacaoService.create(data)
      setTransacoes((prev) => [res.data, ...prev])
      setShowCreate(false)
      addToast('Transação criada com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar transação.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Transferência ────────────────────────────────────────────
  async function handleTransferir(data: TransferenciaRequest) {
    try {
      await transacaoService.transferir(data)
      setShowTransferencia(false)
      addToast('Transferência realizada com sucesso!', 'success')
      loadTransacoes()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao realizar transferência.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Pagar Fatura ─────────────────────────────────────────────
  async function handlePagarFatura(data: PagamentoFaturaRequest) {
    try {
      await transacaoService.pagarFatura(data)
      setShowPagamentoFatura(false)
      addToast('Fatura paga com sucesso!', 'success')
      loadTransacoes()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao pagar fatura.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Estornar ─────────────────────────────────────────────────
  async function handleEstornar(transacao: Transacao) {
    if (!window.confirm(`Estornar a transação "${transacao.descricao}"?`)) return
    const previous = transacoes
    // Optimistic update: marca como estornada
    setTransacoes((prev) =>
      prev.map((t) => (t.id === transacao.id ? { ...t, estornada: true } : t))
    )
    try {
      await transacaoService.estornar(transacao.id, { transacaoId: transacao.id })
      addToast('Transação estornada com sucesso!', 'success')
    } catch (err: unknown) {
      setTransacoes(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao estornar transação.'
      addToast(msg, 'error')
    }
  }

  // ─── Excluir (Soft Delete / Optimistic) ────────────────────────
  async function handleExcluir(transacao: Transacao) {
    if (!window.confirm(`Excluir a transação "${transacao.descricao}"?`)) return
    const previous = transacoes
    setTransacoes((prev) => prev.filter((t) => t.id !== transacao.id))
    try {
      await transacaoService.excluir(transacao.id)
      addToast('Transação excluída com sucesso!', 'success')
    } catch (err: unknown) {
      setTransacoes(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir transação.'
      addToast(msg, 'error')
    }
  }

  return (
    <div className="transacoes-page">
      {/* Header */}
      <div className="transacoes-header">
        <div>
          <h1 className="transacoes-header__title">Transações</h1>
          <p className="transacoes-header__subtitle">Registre e acompanhe todos os seus movimentos financeiros</p>
        </div>
        <div className="transacoes-header__actions">
          <button
            className="btn-nova-transacao"
            onClick={() => setShowCreate(true)}
            id="btn-nova-transacao"
          >
            <Plus size={18} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="transacoes-filters">
        <div className="transacoes-filters__group">
          <label htmlFor="filtro-tipo">Tipo</label>
          <select
            id="filtro-tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoFiltro)}
          >
            {TIPO_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="transacoes-filters__group">
          <label htmlFor="filtro-data-inicio">Data Início</label>
          <input
            id="filtro-data-inicio"
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
          />
        </div>

        <div className="transacoes-filters__group">
          <label htmlFor="filtro-data-fim">Data Fim</label>
          <input
            id="filtro-data-fim"
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
          />
        </div>

        <div className="transacoes-filters__group">
          <label htmlFor="filtro-descricao">Buscar</label>
          <input
            id="filtro-descricao"
            type="text"
            placeholder="Descrição..."
            value={filtroDescricao}
            onChange={(e) => setFiltroDescricao(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="transacoes-filters__clear"
          onClick={() => {
            setFiltroTipo('ALL')
            setFiltroDataInicio(getMonthRange().start)
            setFiltroDataFim(getMonthRange().end)
            setFiltroDescricao('')
          }}
        >
          Limpar Filtros
        </button>
      </div>

      {/* Action Buttons */}
      <div className="transacoes-actions">
        <button
          type="button"
          className="btn-accao"
          onClick={() => setShowTransferencia(true)}
        >
          <ArrowLeftRight size={16} />
          Transferir
        </button>
        <button
          type="button"
          className="btn-accao"
          onClick={() => setShowPagamentoFatura(true)}
        >
          <CreditCard size={16} />
          Pagar Fatura
        </button>
        <button
          type="button"
          className="btn-accao"
          onClick={() => setShowProjecao(true)}
        >
          <TrendingUp size={16} />
          Projeção
        </button>
      </div>

      {/* Transaction List */}
      {loading && transacoes.length === 0 ? (
        <div className="transacoes-list--empty">
          <p>Carregando transações...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="transacoes-list--empty">
          <TrendingUp size={40} />
          <p>Nenhuma transação encontrada.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
            {transacoes.length === 0
              ? 'Clique em "Nova Transação" para começar.'
              : 'Tente ajustar os filtros.'}
          </p>
        </div>
      ) : (
        <div className="transacoes-list">
          {sorted.map((t) => (
            <TransacaoCard
              key={t.id}
              transacao={t}
              onEstornar={handleEstornar}
              onExcluir={handleExcluir}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateTransacaoModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {showTransferencia && (
        <TransferenciaModal
          onClose={() => setShowTransferencia(false)}
          onSubmit={handleTransferir}
        />
      )}

      {showPagamentoFatura && (
        <PagamentoFaturaModal
          onClose={() => setShowPagamentoFatura(false)}
          onSubmit={handlePagarFatura}
        />
      )}

      {showProjecao && (
        <ProjecaoModal
          onClose={() => setShowProjecao(false)}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}