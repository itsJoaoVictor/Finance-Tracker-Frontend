import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Sparkles,
  Plus,
  Wallet,
  Receipt,
  CreditCard as CreditCardIcon,
  AlertTriangle,
  Leaf
} from 'lucide-react'
import {
  Cartao,
  CartaoCriacaoRequest,
  CartaoEdicaoRequest,
  Conta,
  ProjecaoCartao,
  TransacaoCriacaoRequest,
  PagamentoFaturaRequest
} from '../../../types'
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
import { PlanejadorComprasModal } from '../components/PlanejadorComprasModal'
import { CreateTransacaoModal } from '../../transacoes/components/CreateTransacaoModal'
import { PagamentoFaturaModal } from '../../transacoes/components/PagamentoFaturaModal'
import { Toast, useToast } from '../../contas/components/Toast'
import '../../contas/contas.css'
import '../cartoes.css'

const ALERT_HIGHLIGHT_TIPOS = new Set([
  'CONCENTRACAO_GASTOS_FATURA',
  'ESTOURO_FATURA',
  'AVISO_FECHAMENTO'
])

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
    totalFaturaEstimada: 0
  })
  const [showCreate, setShowCreate] = useState(false)
  const [editCartao, setEditCartao] = useState<Cartao | null>(null)
  const [viewFaturasCartao, setViewFaturasCartao] = useState<Cartao | null>(null)
  const [novaTransacaoCartao, setNovaTransacaoCartao] = useState<Cartao | null>(null)
  const [pagarFaturaCartao, setPagarFaturaCartao] = useState<Cartao | null>(null)
  const [showPlanejador, setShowPlanejador] = useState(false)
  const [hubTab, setHubTab] = useState<'folga' | 'alertas'>('folga')
  const { toasts, addToast, dismiss } = useToast()

  const loadDados = useCallback(async () => {
    setLoading(true)
    try {
      await iaService.processarTodosInsightsCartao().catch(() => {})

      const [cartoesRes, contasRes, resumoRes, insightsRes, projecoesRes, folgaRes] =
        await Promise.all([
          cartaoService.getAll(),
          contaService.getAll(),
          cartaoService.getResumo(),
          iaService.getInsights().catch(() => ({ data: [] as IaInsight[] })),
          iaService
            .getProjecaoCartoes()
            .catch(() => ({ data: { projecoes: [] as ProjecaoCartao[] } })),
          iaService.verificarOtimizacaoParcelamento().catch(() => ({ data: { items: [] } }))
        ])
      setCartoes(cartoesRes.data)
      setContas(contasRes.data)

      // Deduplicação rigorosa de insights (por tipo único ou assinatura de conteúdo)
      const TIPOS_UNICOS = new Set(['MELHOR_CARTAO'])
      const seenTipos = new Set<string>()
      const seenContentKeys = new Set<string>()

      const insightsDedupados = insightsRes.data.filter((ins) => {
        if (ins.tipo === 'OTIMIZACAO_PARCELAMENTO') return false
        if (TIPOS_UNICOS.has(ins.tipo)) {
          if (seenTipos.has(ins.tipo)) return false
          seenTipos.add(ins.tipo)
          return true
        }
        const contentKey = `${ins.tipo}::${ins.titulo?.trim()}::${ins.mensagem?.trim()}`
        if (seenContentKeys.has(contentKey)) return false
        seenContentKeys.add(contentKey)
        return true
      })

      setInsights(insightsDedupados)
      setFolgaLimiteItems(folgaRes.data.items)
      setProjecoes(projecoesRes.data.projecoes)
      setResumo({
        totalLimite: resumoRes.data.totalLimite,
        totalLimiteDisponivel: resumoRes.data.totalLimiteDisponivel,
        totalFaturaEstimada: resumoRes.data.totalFaturaEstimada
      })
    } catch {
      addToast('Erro ao carregar dados dos cartões.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadDados()
  }, [loadDados])

  // Deduplicated alert insights for the Hub counter
  const alertInsights = useMemo(
    () => insights.filter((ins) => ALERT_HIGHLIGHT_TIPOS.has(ins.tipo)),
    [insights]
  )

  // Ajusta aba ativa do Hub automaticamente quando uma delas está vazia
  useEffect(() => {
    if (folgaLimiteItems.length === 0 && alertInsights.length > 0) {
      setHubTab('alertas')
    } else if (folgaLimiteItems.length > 0 && alertInsights.length === 0) {
      setHubTab('folga')
    }
  }, [folgaLimiteItems.length, alertInsights.length])

  // Identifica o Melhor Cartão do momento
  const melhorCartaoInfo = useMemo(() => {
    const melhorIns = insights.find((i) => i.tipo === 'MELHOR_CARTAO')
    if (melhorIns?.metadados) {
      try {
        const meta = JSON.parse(melhorIns.metadados)
        const found = cartoes.find((c) => c.id === meta.cartaoId)
        if (found) return { cartao: found, mensagem: melhorIns.mensagem }
      } catch {
        /* ignore */
      }
    }
    if (cartoes.length > 0) {
      const sorted = [...cartoes].sort((a, b) => b.limiteDisponivel - a.limiteDisponivel)
      return { cartao: sorted[0], mensagem: 'Maior limite disponível no momento' }
    }
    return null
  }, [insights, cartoes])

  const totalFolgaMensal = useMemo(() => {
    return folgaLimiteItems
      .filter((i) => i.tipo !== 'A_VISTA_AGRUPADO')
      .reduce((acc, i) => acc + (Number(i.impactoMensal) || 0), 0)
  }, [folgaLimiteItems])

  // ─── Criar ───────────────────────────────────────────────────
  async function handleCreate(data: CartaoCriacaoRequest) {
    try {
      const res = await cartaoService.create(data)
      const novo = res.data
      setCartoes((prev) => [...prev, novo])

      setResumo((prev) => ({
        totalLimite: prev.totalLimite + novo.limite,
        totalLimiteDisponivel: prev.totalLimiteDisponivel + novo.limiteDisponivel,
        totalFaturaEstimada: prev.totalFaturaEstimada + (novo.limite - novo.limiteDisponivel)
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

    const antigo = cartoes.find((c) => c.id === id)
    if (!antigo) return

    const diferenca = data.limite - antigo.limite
    const novoDisponivel = antigo.limiteDisponivel + diferenca
    const novaFatura = data.limite - novoDisponivel

    setCartoes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, limiteDisponivel: novoDisponivel } : c))
    )
    setResumo((prev) => ({
      totalLimite: prev.totalLimite + diferenca,
      totalLimiteDisponivel: prev.totalLimiteDisponivel + diferenca,
      totalFaturaEstimada:
        prev.totalFaturaEstimada + (novaFatura - (antigo.limite - antigo.limiteDisponivel))
    }))
    setEditCartao(null)

    try {
      const res = await cartaoService.update(id, data)
      setCartoes((prev) => prev.map((c) => (c.id === id ? res.data : c)))

      const resumoRes = await cartaoService.getResumo()
      setResumo(resumoRes.data)

      addToast('Cartão de crédito atualizado com sucesso!', 'success')
    } catch (err: unknown) {
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

    setCartoes((prev) => prev.filter((c) => c.id !== cartao.id))
    setResumo((prev) => ({
      totalLimite: prev.totalLimite - cartao.limite,
      totalLimiteDisponivel: prev.totalLimiteDisponivel - cartao.limiteDisponivel,
      totalFaturaEstimada: prev.totalFaturaEstimada - (cartao.limite - cartao.limiteDisponivel)
    }))

    try {
      await cartaoService.softDelete(cartao.id)
      addToast('Cartão excluído com sucesso!', 'success')
    } catch (err: unknown) {
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

  function handleDismissAllFolga() {
    setFolgaLimiteItems([])
  }

  const handleOpenCreate = () => {
    if (contas.length === 0) {
      addToast('Você precisa criar uma conta antes de cadastrar um cartão.', 'error')
    } else {
      setShowCreate(true)
    }
  }

  const percDisponivel =
    resumo.totalLimite > 0
      ? Math.min(100, Math.max(0, (resumo.totalLimiteDisponivel / resumo.totalLimite) * 100))
      : 0
  const percConsumido =
    resumo.totalLimite > 0
      ? Math.min(100, Math.max(0, (resumo.totalFaturaEstimada / resumo.totalLimite) * 100))
      : 0

  const showIntelligenceHub = folgaLimiteItems.length > 0 || alertInsights.length > 0

  return (
    <div className="cartoes-page">
      {/* 1. Action Bar Superior */}
      <header className="cartoes-top-bar">
        <div className="cartoes-top-bar__intro">
          <h1 className="cartoes-top-bar__title">Meus Cartões & Faturas</h1>
          <p className="cartoes-top-bar__subtitle">
            Gerencie limites, acompanhe projeções de fechamento com IA e simule novas compras
          </p>
        </div>

        <div className="cartoes-top-bar__actions">
          <button
            type="button"
            className="btn-planejador"
            onClick={() => setShowPlanejador(true)}
          >
            <Sparkles size={16} />
            <span>Planejador de Compras</span>
          </button>
          <button
            type="button"
            className="btn-nova-conta"
            onClick={handleOpenCreate}
            id="btn-novo-cartao"
          >
            <Plus size={16} />
            <span>Novo Cartão</span>
          </button>
        </div>
      </header>

      {/* 2. Bento Grid de 4 KPIs */}
      <section className="cartoes-kpi-grid" aria-label="Resumo geral dos cartões">
        {/* KPI 1: Limite Disponível */}
        <div className="cartoes-kpi-card cartoes-kpi-card--emerald">
          <div className="cartoes-kpi-card__top">
            <span className="cartoes-kpi-card__label">Limite Disponível</span>
            <div className="cartoes-kpi-card__icon cartoes-kpi-card__icon--emerald">
              <Wallet size={17} />
            </div>
          </div>
          <div className="cartoes-kpi-card__value cartoes-kpi-card__value--emerald">
            {loading ? '...' : formatCurrency(resumo.totalLimiteDisponivel)}
          </div>
          <div className="cartoes-kpi-card__footer">
            <div className="cartoes-kpi-card__mini-bar">
              <div
                className="cartoes-kpi-card__mini-bar-fill cartoes-kpi-card__mini-bar-fill--emerald"
                style={{ width: `${percDisponivel}%` }}
              />
            </div>
            <span className="cartoes-kpi-card__meta">
              <strong>{percDisponivel.toFixed(0)}%</strong> livre para uso
            </span>
          </div>
        </div>

        {/* KPI 2: Fatura Estimada */}
        <div className="cartoes-kpi-card cartoes-kpi-card--rose">
          <div className="cartoes-kpi-card__top">
            <span className="cartoes-kpi-card__label">Fatura Estimada</span>
            <div className="cartoes-kpi-card__icon cartoes-kpi-card__icon--rose">
              <Receipt size={17} />
            </div>
          </div>
          <div className="cartoes-kpi-card__value cartoes-kpi-card__value--rose">
            {loading ? '...' : formatCurrency(resumo.totalFaturaEstimada)}
          </div>
          <div className="cartoes-kpi-card__footer">
            <div className="cartoes-kpi-card__mini-bar">
              <div
                className="cartoes-kpi-card__mini-bar-fill cartoes-kpi-card__mini-bar-fill--rose"
                style={{ width: `${percConsumido}%` }}
              />
            </div>
            <span className="cartoes-kpi-card__meta">
              <strong>{percConsumido.toFixed(0)}%</strong> do limite comprometido
            </span>
          </div>
        </div>

        {/* KPI 3: Limite Total */}
        <div className="cartoes-kpi-card">
          <div className="cartoes-kpi-card__top">
            <span className="cartoes-kpi-card__label">Limite Total</span>
            <div className="cartoes-kpi-card__icon cartoes-kpi-card__icon--blue">
              <CreditCardIcon size={17} />
            </div>
          </div>
          <div className="cartoes-kpi-card__value">
            {loading ? '...' : formatCurrency(resumo.totalLimite)}
          </div>
          <div className="cartoes-kpi-card__footer">
            <span className="cartoes-kpi-card__meta">
              Soma de {cartoes.length} {cartoes.length === 1 ? 'cartão' : 'cartões'}
            </span>
          </div>
        </div>

        {/* KPI 4: Cartões Ativos & Recomendação IA */}
        <div className="cartoes-kpi-card">
          <div className="cartoes-kpi-card__top">
            <span className="cartoes-kpi-card__label">Cartões Ativos</span>
            <div className="cartoes-kpi-card__icon cartoes-kpi-card__icon--purple">
              <Sparkles size={17} />
            </div>
          </div>
          <div className="cartoes-kpi-card__value">{loading ? '...' : cartoes.length}</div>
          <div className="cartoes-kpi-card__footer">
            {melhorCartaoInfo ? (
              <span
                className="cartoes-kpi-card__best-pill"
                title={melhorCartaoInfo.mensagem}
              >
                <span
                  className="cartoes-kpi-card__best-dot"
                  style={{
                    backgroundColor: melhorCartaoInfo.cartao.corHexadecimal || '#10b981'
                  }}
                />
                <span className="cartoes-kpi-card__best-text">
                  Melhor hoje: <strong>{melhorCartaoInfo.cartao.nome}</strong>
                </span>
              </span>
            ) : (
              <span className="cartoes-kpi-card__meta">Nenhum cartão ativo</span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Grid de Cartões de Crédito (Primeira Dobra!) */}
      <section className="cartoes-main-section" aria-label="Cartões de Crédito">
        <div className="cartoes-section-header">
          <div>
            <h2 className="cartoes-section-header__title">Carteira de Cartões</h2>
            <p className="cartoes-section-header__subtitle">
              Clique sobre qualquer cartão para abrir faturas, evolução mensal e antecipação de parcelas
            </p>
          </div>
        </div>

        <CardList
          cartoes={cartoes}
          contas={contas}
          loading={loading}
          insights={insights}
          projecoes={projecoes}
          onEdit={(c) => setEditCartao(c)}
          onDelete={handleDelete}
          onViewFaturas={(c) => setViewFaturasCartao(c)}
          onNovaTransacao={(c) => setNovaTransacaoCartao(c)}
          onPagarFatura={(c) => setPagarFaturaCartao(c)}
          onRefreshInsights={loadDados}
          onCreateNew={handleOpenCreate}
        />
      </section>

      {/* 4. Hub Unificado: Inteligência & Alívio de Limite */}
      {showIntelligenceHub && (
        <section className="cartoes-intelligence-hub" aria-label="Inteligência e Alívio de Limite">
          <div className="cartoes-intelligence-hub__header">
            <div className="cartoes-intelligence-hub__title-group">
              <div className="cartoes-intelligence-hub__badge-icon">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="cartoes-intelligence-hub__title">
                  Inteligência & Alívio de Limite
                </h2>
                <p className="cartoes-intelligence-hub__subtitle">
                  Otimização automática de faturas, parcelas prestes a quitar e alertas da IA
                </p>
              </div>
            </div>

            <div className="cartoes-intelligence-hub__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={hubTab === 'folga'}
                className={`cartoes-hub-tab ${hubTab === 'folga' ? 'active' : ''}`}
                onClick={() => setHubTab('folga')}
              >
                <Leaf size={14} />
                <span>Alívio no Próximo Ciclo</span>
                {totalFolgaMensal > 0 ? (
                  <span className="cartoes-hub-tab__pill cartoes-hub-tab__pill--emerald">
                    +{formatCurrency(totalFolgaMensal)}
                  </span>
                ) : (
                  <span className="cartoes-hub-tab__pill">{folgaLimiteItems.length}</span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={hubTab === 'alertas'}
                className={`cartoes-hub-tab ${hubTab === 'alertas' ? 'active' : ''}`}
                onClick={() => setHubTab('alertas')}
              >
                <AlertTriangle size={14} />
                <span>Alertas de Gastos (IA)</span>
                <span
                  className={`cartoes-hub-tab__pill ${
                    alertInsights.length > 0 ? 'cartoes-hub-tab__pill--rose' : ''
                  }`}
                >
                  {alertInsights.length}
                </span>
              </button>
            </div>
          </div>

          <div className="cartoes-intelligence-hub__body">
            {hubTab === 'folga' ? (
              folgaLimiteItems.length > 0 ? (
                <FolgaLimiteSection
                  items={folgaLimiteItems}
                  cartoes={cartoes}
                  onDismiss={handleDismissFolga}
                  onDismissAll={handleDismissAllFolga}
                  defaultShowGrid={false}
                />
              ) : (
                <div className="ai-highlights-empty">
                  <Leaf size={20} />
                  <p>Nenhum parcelamento encerrando no ciclo atual no momento.</p>
                </div>
              )
            ) : (
              <AICardHighlights
                insights={insights}
                onDismiss={handleDismissHighlight}
                embedded={true}
              />
            )}
          </div>
        </section>
      )}

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
          onPagarFatura={(c) => setPagarFaturaCartao(c)}
        />
      )}

      {novaTransacaoCartao && (
        <CreateTransacaoModal
          initialTipo="COMPRA_CREDITO"
          initialCartaoId={novaTransacaoCartao.id}
          onClose={() => setNovaTransacaoCartao(null)}
          onSubmit={handleNovaTransacaoSubmit}
        />
      )}

      {pagarFaturaCartao && (
        <PagamentoFaturaModal
          initialCartaoId={pagarFaturaCartao.id}
          onClose={() => setPagarFaturaCartao(null)}
          onSubmit={handlePagarFaturaSubmit}
        />
      )}

      {showPlanejador && (
        <PlanejadorComprasModal
          onClose={() => setShowPlanejador(false)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
