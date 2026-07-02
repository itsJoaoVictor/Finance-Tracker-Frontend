import { useEffect, useState, useCallback } from 'react'
import { Transacao, TransacaoCriacaoRequest, TransferenciaRequest, PagamentoFaturaRequest, TipoTransacao } from '../../../types'
import { transacaoService } from '../../../services/transacaoService'
import { Toast, useToast } from '../../../components/Toast'
import { TransacaoCard } from '../components/TransacaoCard'
import { CreateTransacaoModal } from '../components/CreateTransacaoModal'
import { TransferenciaModal } from '../components/TransferenciaModal'
import { PagamentoFaturaModal } from '../components/PagamentoFaturaModal'
import { ProjecaoModal } from '../components/ProjecaoModal'
import { AnteciparParcelasModal } from '../components/AnteciparParcelasModal'
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
  const [paginaAtual, setPaginaAtual] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)



  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('ALL')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [dataInicioExibicao, setDataInicioExibicao] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [dataFimExibicao, setDataFimExibicao] = useState('')
  const [filtroDescricao, setFiltroDescricao] = useState('')

  const handleDataInicioChange = (valStr: string) => {
    let val = valStr.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    let formatted = val
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    setDataInicioExibicao(formatted)

    if (val.length === 8) {
      const day = val.slice(0, 2)
      const month = val.slice(2, 4)
      const year = val.slice(4)
      setFiltroDataInicio(`${year}-${month}-${day}`)
      setPaginaAtual(0)
    } else if (val.length === 0) {
      setFiltroDataInicio('')
      setPaginaAtual(0)
    }
  }

  const handleDataFimChange = (valStr: string) => {
    let val = valStr.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    let formatted = val
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    setDataFimExibicao(formatted)

    if (val.length === 8) {
      const day = val.slice(0, 2)
      const month = val.slice(2, 4)
      const year = val.slice(4)
      setFiltroDataFim(`${year}-${month}-${day}`)
      setPaginaAtual(0)
    } else if (val.length === 0) {
      setFiltroDataFim('')
      setPaginaAtual(0)
    }
  }

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showTransferencia, setShowTransferencia] = useState(false)
  const [showPagamentoFatura, setShowPagamentoFatura] = useState(false)
  const [showProjecao, setShowProjecao] = useState(false)
  const [anteciparTransacao, setAnteciparTransacao] = useState<Transacao | null>(null)

  const { toasts, addToast, dismiss } = useToast()

  // ─── Load transacoes ──────────────────────────────────────────
  const loadTransacoes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transacaoService.getAll({
        tipo: filtroTipo !== 'ALL' ? filtroTipo : undefined,
        descricao: filtroDescricao.trim() || undefined,
        dataInicio: filtroDataInicio || undefined,
        dataFim: filtroDataFim || undefined,
        page: paginaAtual,
        size: 10
      })
      setTransacoes(res.data.content)
      setTotalPaginas(res.data.totalPages)
    } catch {
      addToast('Erro ao carregar transações.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filtroTipo, filtroDescricao, filtroDataInicio, filtroDataFim, paginaAtual, addToast])

  useEffect(() => {
    loadTransacoes()
  }, [loadTransacoes])

  const sorted = transacoes

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
            onChange={(e) => {
              setFiltroTipo(e.target.value as TipoFiltro)
              setPaginaAtual(0)
            }}
          >
            {TIPO_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="transacoes-filters__group">
          <label htmlFor="filtro-data-inicio">Data Início</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="filtro-data-inicio"
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataInicioExibicao}
              onChange={(e) => handleDataInicioChange(e.target.value)}
              style={{ paddingRight: '36px', width: '100%' }}
            />
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => {
                const selectedDate = e.target.value
                if (selectedDate) {
                  const parts = selectedDate.split('-')
                  handleDataInicioChange(`${parts[2]}/${parts[1]}/${parts[0]}`)
                }
              }}
              style={{
                position: 'absolute',
                right: '8px',
                width: '20px',
                height: '20px',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2
              }}
            />
            <span style={{ position: 'absolute', right: '10px', pointerEvents: 'none', zIndex: 1 }}>
              📅
            </span>
          </div>
        </div>

        <div className="transacoes-filters__group">
          <label htmlFor="filtro-data-fim">Data Fim</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="filtro-data-fim"
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataFimExibicao}
              onChange={(e) => handleDataFimChange(e.target.value)}
              style={{ paddingRight: '36px', width: '100%' }}
            />
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => {
                const selectedDate = e.target.value
                if (selectedDate) {
                  const parts = selectedDate.split('-')
                  handleDataFimChange(`${parts[2]}/${parts[1]}/${parts[0]}`)
                }
              }}
              style={{
                position: 'absolute',
                right: '8px',
                width: '20px',
                height: '20px',
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2
              }}
            />
            <span style={{ position: 'absolute', right: '10px', pointerEvents: 'none', zIndex: 1 }}>
              📅
            </span>
          </div>
        </div>

        <div className="transacoes-filters__group">
          <label htmlFor="filtro-descricao">Buscar</label>
          <input
            id="filtro-descricao"
            type="text"
            placeholder="Descrição..."
            value={filtroDescricao}
            onChange={(e) => {
              setFiltroDescricao(e.target.value)
              setPaginaAtual(0)
            }}
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
            setPaginaAtual(0)
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
        <>
          <div className="transacoes-list">
            {sorted.map((t) => (
              <TransacaoCard
                key={t.id}
                transacao={t}
                onEstornar={handleEstornar}
                onExcluir={handleExcluir}
                onAntecipar={setAnteciparTransacao}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPaginas > 0 && (
            <div className="pagination">
              <button
                type="button"
                className="pagination__btn"
                disabled={paginaAtual === 0 || loading}
                onClick={() => setPaginaAtual((prev) => Math.max(0, prev - 1))}
              >
                Anterior
              </button>
              <span className="pagination__info">
                Página {paginaAtual + 1} de {totalPaginas}
              </span>
              <button
                type="button"
                className="pagination__btn"
                disabled={paginaAtual >= totalPaginas - 1 || loading}
                onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas - 1, prev + 1))}
              >
                Próxima
              </button>
            </div>
          )}
        </>
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

      {anteciparTransacao && (
        <AnteciparParcelasModal
          transacao={anteciparTransacao}
          onClose={() => setAnteciparTransacao(null)}
          onSuccess={() => {
            setAnteciparTransacao(null)
            addToast('Parcelas antecipadas com sucesso!', 'success')
            loadTransacoes()
          }}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}