import { useEffect, useState, useCallback } from 'react'
import { Cartao, CartaoCriacaoRequest, CartaoEdicaoRequest, Conta, ProjecaoCartao, TransacaoCriacaoRequest, PagamentoFaturaRequest } from '../../../types'
import { cartaoService } from '../../../services/cartaoService'
import { contaService } from '../../../services/contaService'
import { transacaoService } from '../../../services/transacaoService'
import { iaService, IaInsight, FolgaLimiteItem } from '../../../services/iaService'
import { AICardHighlights } from '../components/AICardHighlights'
import { FolgaLimiteSection } from '../components/FolgaLimiteSection'
import { CardList } from '../components/CardList'
import { CreateCardModal } from '../components/CreateCardModal'
import { EditCardModal } from '../components/EditCardModal'
import { CartaoFaturasModal } from '../components/CartaoFaturasModal'
import { CreateTransacaoModal } from '../../transacoes/components/CreateTransacaoModal'
import { PagamentoFaturaModal } from '../../transacoes/components/PagamentoFaturaModal'
import { Toast, useToast } from '../../contas/components/Toast'
import '../../contas/contas.css'
import '../cartoes.css'

export function Cartoes() {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [insights, setInsights] = useState<IaInsight[]>([])
  const [folgaLimiteItems, setFolgaLimiteItems] = useState<FolgaLimiteItem[]>([])
  const [projecoes, setProjecoes] = useState<ProjecaoCartao[]>([])
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState({
    totalLimite: 0,
    totalLimiteDisponivel: 0,
    totalFaturaEstimada: 0,
  })
  const [showCreate, setShowCreate] = useState(false)
  const [editCartao, setEditCartao] = useState<Cartao | null>(null)
  const [viewFaturasCartao, setViewFaturasCartao] = useState<Cartao | null>(null)
  const [novaTransacaoCartao, setNovaTransacaoCartao] = useState<Cartao | null>(null)
  const [pagarFaturaCartao, setPagarFaturaCartao] = useState<Cartao | null>(null)
  const { toasts, addToast, dismiss } = useToast()

  const loadDados = useCallback(async () => {
    setLoading(true)
    try {
      // Processa TODOS os insights dedicados de cartão em uma única chamada
      await iaService.processarTodosInsightsCartao().catch(() => {})

      const [cartoesRes, contasRes, resumoRes, insightsRes, projecoesRes, folgaRes] = await Promise.all([
        cartaoService.getAll(),
        contaService.getAll(),
        cartaoService.getResumo(),
        iaService.getInsights().catch(() => ({ data: [] as IaInsight[] })),
        iaService.getProjecaoCartoes().catch(() => ({ data: { projecoes: [] as ProjecaoCartao[] } })),
        iaService.verificarOtimizacaoParcelamento().catch(() => ({ data: { items: [] } })),
      ])
      setCartoes(cartoesRes.data)
      setContas(contasRes.data)
      // Deduplica insights: MELHOR_CARTAO uma vez
      const TIPOS_UNICOS = new Set(['MELHOR_CARTAO'])
      const seenTipos = new Set<string>()
      const insightsDedupados = insightsRes.data.filter((ins) => {
        if (TIPOS_UNICOS.has(ins.tipo)) {
          if (seenTipos.has(ins.tipo)) return false
          seenTipos.add(ins.tipo)
          return true
        }
        // OTIMIZACAO_PARCELAMENTO não vem mais por aqui (endpoint dedicado)
        if (ins.tipo === 'OTIMIZACAO_PARCELAMENTO') return false
        return true
      })
      setInsights(insightsDedupados)
      setFolgaLimiteItems(folgaRes.data.items)

      setProjecoes(projecoesRes.data.projecoes)
      setResumo({
        totalLimite: resumoRes.data.totalLimite,
        totalLimiteDisponivel: resumoRes.data.totalLimiteDisponivel,
        totalFaturaEstimada: resumoRes.data.totalFaturaEstimada,
      })
    } catch {
      addToast('Erro ao carregar dados dos cartões.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDados()
  }, [loadDados])

  // ─── Criar ───────────────────────────────────────────────────
  async function handleCreate(data: CartaoCriacaoRequest) {
    try {
      const res = await cartaoService.create(data)
      const novo = res.data
      setCartoes((prev) => [...prev, novo])
      
      // Atualiza valores do resumo
      setResumo((prev) => ({
        totalLimite: prev.totalLimite + novo.limite,
        totalLimiteDisponivel: prev.totalLimiteDisponivel + novo.limiteDisponivel,
        totalFaturaEstimada: prev.totalFaturaEstimada + (novo.limite - novo.limiteDisponivel),
      }))

      setShowCreate(false)
      addToast('Cartão de crédito criado com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar cartão.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Editar ───────────────────────────────────────────────────
  async function handleEdit(id: string, data: CartaoEdicaoRequest) {
    const previousCartoes = cartoes
    const previousResumo = resumo

    // Encontra o cartão atual
    const antigo = cartoes.find((c) => c.id === id)
    if (!antigo) return

    // Recalcula limites de forma otimista
    const diferenca = data.limite - antigo.limite
    const novoDisponivel = antigo.limiteDisponivel + diferenca
    const novaFatura = data.limite - novoDisponivel

    // Atualização otimista do estado
    setCartoes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, limiteDisponivel: novoDisponivel } : c))
    )
    setResumo((prev) => ({
      totalLimite: prev.totalLimite + diferenca,
      totalLimiteDisponivel: prev.totalLimiteDisponivel + diferenca,
      totalFaturaEstimada: prev.totalFaturaEstimada + (novaFatura - (antigo.limite - antigo.limiteDisponivel)),
    }))
    setEditCartao(null)

    try {
      const res = await cartaoService.update(id, data)
      // Atualiza com os valores oficiais do servidor
      setCartoes((prev) => prev.map((c) => (c.id === id ? res.data : c)))
      
      // Recarrega o resumo oficial
      const resumoRes = await cartaoService.getResumo()
      setResumo(resumoRes.data)

      addToast('Cartão de crédito atualizado com sucesso!', 'success')
    } catch (err: unknown) {
      // Rollback
      setCartoes(previousCartoes)
      setResumo(previousResumo)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar cartão.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir ──────────────────────────────────────────────────
  async function handleDelete(cartao: Cartao) {
    if (!window.confirm(`Excluir o cartão "${cartao.nome}"?`)) return
    const previousCartoes = cartoes
    const previousResumo = resumo

    // Atualização otimista
    setCartoes((prev) => prev.filter((c) => c.id !== cartao.id))
    setResumo((prev) => ({
      totalLimite: prev.totalLimite - cartao.limite,
      totalLimiteDisponivel: prev.totalLimiteDisponivel - cartao.limiteDisponivel,
      totalFaturaEstimada: prev.totalFaturaEstimada - (cartao.limite - cartao.limiteDisponivel),
    }))

    try {
      await cartaoService.softDelete(cartao.id)
      addToast('Cartão excluído com sucesso!', 'success')
    } catch (err: unknown) {
      // Rollback
      setCartoes(previousCartoes)
      setResumo(previousResumo)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir cartão.'
      addToast(msg, 'error')
    }
  }

  async function handleNovaTransacaoSubmit(data: TransacaoCriacaoRequest) {
    try {
      await transacaoService.create(data)
      addToast('Transação registrada com sucesso!', 'success')
      setNovaTransacaoCartao(null)
      loadDados()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao registrar transação.'
      addToast(msg, 'error')
      throw err
    }
  }

  async function handlePagarFaturaSubmit(data: PagamentoFaturaRequest) {
    try {
      await transacaoService.pagarFatura(data)
      addToast('Pagamento de fatura registrado com sucesso!', 'success')
      setPagarFaturaCartao(null)
      loadDados()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao registrar pagamento.'
      addToast(msg, 'error')
      throw err
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function handleDismissHighlight(id: string) {
    setInsights((prev) => prev.filter((ins) => ins.id !== id))
  }

  function handleDismissFolga(id: string) {
    setFolgaLimiteItems((prev) => prev.filter((ins) => ins.id !== id))
  }

  return (
    <div className="contas-page">
      {/* Header */}
      <div className="contas-header">
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-nova-conta"
            onClick={() => {
              if (contas.length === 0) {
                addToast('Você precisa criar uma conta antes de cadastrar um cartão.', 'error')
              } else {
                setShowCreate(true)
              }
            }}
            id="btn-novo-cartao"
          >
            + Novo Cartão
          </button>
        </div>
      </div>

      {/* Resumos */}
      <div className="contas-resumo">
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Limite Disponível</span>
          <span className="contas-resumo__value contas-resumo__value--green">
            {loading ? '...' : formatCurrency(resumo.totalLimiteDisponivel)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Limite Total</span>
          <span className="contas-resumo__value">
            {loading ? '...' : formatCurrency(resumo.totalLimite)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Fatura Estimada</span>
          <span className="contas-resumo__value" style={{ color: '#E63946' }}>
            {loading ? '...' : formatCurrency(resumo.totalFaturaEstimada)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Cartões Ativos</span>
          <span className="contas-resumo__value">{loading ? '...' : cartoes.length}</span>
        </div>
      </div>

      {/* Destaques da IA */}
      <AICardHighlights
        insights={insights}
        onDismiss={handleDismissHighlight}
      />

      {/* Folga de Limite: Parcelamentos que terminam nesta fatura */}
      <FolgaLimiteSection
        items={folgaLimiteItems}
        onDismiss={handleDismissFolga}
      />

      {/* Lista de Cartões */}
      <CardList
        cartoes={cartoes}
        contas={contas}
        loading={loading}
        insights={insights}
        projecoes={projecoes}
        onEdit={setEditCartao}
        onDelete={handleDelete}
        onViewFaturas={setViewFaturasCartao}
        onNovaTransacao={setNovaTransacaoCartao}
        onPagarFatura={setPagarFaturaCartao}
        onRefreshInsights={loadDados}
      />

      {/* Modais */}
      {showCreate && (
        <CreateCardModal
          contas={contas}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editCartao && (
        <EditCardModal
          cartao={editCartao}
          contas={contas}
          onClose={() => setEditCartao(null)}
          onSubmit={handleEdit}
        />
      )}
      {viewFaturasCartao && (
        <CartaoFaturasModal
          cartao={viewFaturasCartao}
          projecao={projecoes.find((p) => p.cartaoId === viewFaturasCartao.id)}
          onClose={() => setViewFaturasCartao(null)}
        />
      )}
      {novaTransacaoCartao && (
        <CreateTransacaoModal
          onClose={() => setNovaTransacaoCartao(null)}
          onSubmit={handleNovaTransacaoSubmit}
          initialCartaoId={novaTransacaoCartao.id}
          initialTipo="COMPRA_CREDITO"
        />
      )}
      {pagarFaturaCartao && (
        <PagamentoFaturaModal
          onClose={() => setPagarFaturaCartao(null)}
          onSubmit={handlePagarFaturaSubmit}
          initialCartaoId={pagarFaturaCartao.id}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
