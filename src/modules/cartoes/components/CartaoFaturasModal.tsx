import { useEffect, useState, useMemo, useCallback } from 'react'
import { Cartao, Fatura, ProjecaoCartao, Transacao } from '../../../types'
import { cartaoService } from '../../../services/cartaoService'
import { transacaoService } from '../../../services/transacaoService'
import { AnteciparParcelasModal } from '../../transacoes/components/AnteciparParcelasModal'
import {
  FastForward,
  Search,
  DollarSign,
  Calendar,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import '../cartoes.css'
import './CartaoFaturasModal.css'

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  const cleanStr = dateStr.split('T')[0]
  const parts = cleanStr.split('-').map(Number)
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  return new Date(dateStr)
}

interface CartaoFaturasModalProps {
  cartao: Cartao
  projecao?: ProjecaoCartao
  onClose: () => void
  onPagarFatura?: (cartao: Cartao) => void
}

export function CartaoFaturasModal({
  cartao,
  projecao,
  onClose,
  onPagarFatura
}: CartaoFaturasModalProps) {
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'historico' | 'atual' | 'proximas'>('atual')
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)

  // Cache de itens por faturaId
  const [faturaItems, setFaturaItems] = useState<Record<string, Transacao[]>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null)
  const [anteciparTransacao, setAnteciparTransacao] = useState<Transacao | null>(null)

  // Filtros rápidos dentro da lista de itens da fatura
  const [searchTerm, setSearchTerm] = useState('')
  const [itemFilter, setItemFilter] = useState<'todas' | 'parceladas' | 'avista'>('todas')

  const loadFaturaTransactions = useCallback(
    async (faturaId: string) => {
      if (faturaItems[faturaId]) return
      setItemsLoading((prev) => ({ ...prev, [faturaId]: true }))
      try {
        const res = await transacaoService.getByFatura(faturaId)
        setFaturaItems((prev) => ({ ...prev, [faturaId]: res.data }))
      } catch (err) {
        console.error('Erro ao buscar transações da fatura', err)
      } finally {
        setItemsLoading((prev) => ({ ...prev, [faturaId]: false }))
      }
    },
    [faturaItems]
  )

  const fetchFaturas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cartaoService.getFaturas(cartao.id)
      const sorted = [...res.data].sort(
        (a, b) =>
          parseLocalDate(a.mesReferencia).getTime() - parseLocalDate(b.mesReferencia).getTime()
      )
      setFaturas(sorted)

      const atual = sorted.find((f) => f.status !== 'PAGA' && !(f.status === 'ATRASADA' && f.rolladoOver))
      const initial = atual || (sorted.length > 0 ? sorted[sorted.length - 1] : null)

      if (initial) {
        setSelectedFatura(initial)
        setExpandedFaturaId(initial.id)
      }
    } catch (err) {
      console.error('Erro ao buscar faturas', err)
    } finally {
      setLoading(false)
    }
  }, [cartao.id])

  useEffect(() => {
    fetchFaturas()
  }, [fetchFaturas])

  // Bloqueia o scroll da página de fundo enquanto o modal de faturas estiver aberto
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // Carrega transações sempre que expandedFaturaId mudar
  useEffect(() => {
    if (expandedFaturaId) {
      loadFaturaTransactions(expandedFaturaId)
    }
  }, [expandedFaturaId, loadFaturaTransactions])

  // Separar faturas históricas vs atual vs próximas
  const { historicoFaturas, atualFaturas, proximasFaturas } = useMemo(() => {
    const sortedFaturas = [...faturas].sort(
      (a, b) => new Date(a.mesReferencia).getTime() - new Date(b.mesReferencia).getTime()
    )

    const atualIndex = sortedFaturas.findIndex((f) => {
      return f.status !== 'PAGA' && !(f.status === 'ATRASADA' && f.rolladoOver)
    })

    const hist: Fatura[] = []
    const atual: Fatura[] = []
    const prox: Fatura[] = []

    if (atualIndex === -1) {
      if (sortedFaturas.length > 0) {
        hist.push(...sortedFaturas.slice(0, -1))
        atual.push(sortedFaturas[sortedFaturas.length - 1])
      }
    } else {
      sortedFaturas.forEach((f, idx) => {
        if (idx < atualIndex) {
          hist.push(f)
        } else if (idx === atualIndex) {
          atual.push(f)
        } else {
          prox.push(f)
        }
      })
    }

    const histSorted = [...hist].sort(
      (a, b) => new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
    )
    const proxSorted = [...prox].sort(
      (a, b) => new Date(a.mesReferencia).getTime() - new Date(b.mesReferencia).getTime()
    )

    return { historicoFaturas: histSorted, atualFaturas: atual, proximasFaturas: proxSorted }
  }, [faturas])

  // Sincroniza clique na barra do gráfico com a aba correspondente e já abre as compras daquela fatura
  function handleSelectFromChart(f: Fatura) {
    setSelectedFatura(f)
    setExpandedFaturaId(f.id)
    if (historicoFaturas.some((hf) => hf.id === f.id)) {
      setActiveTab('historico')
    } else if (atualFaturas.some((af) => af.id === f.id)) {
      setActiveTab('atual')
    } else if (proximasFaturas.some((pf) => pf.id === f.id)) {
      setActiveTab('proximas')
    }
  }

  function handleTabChange(tab: 'historico' | 'atual' | 'proximas') {
    setActiveTab(tab)
    const list =
      tab === 'historico' ? historicoFaturas : tab === 'atual' ? atualFaturas : proximasFaturas
    if (list.length > 0) {
      setSelectedFatura(list[0])
      setExpandedFaturaId(list[0].id)
    }
  }

  async function handleToggleExpand(f: Fatura) {
    setSelectedFatura(f)
    if (expandedFaturaId === f.id) {
      setExpandedFaturaId(null)
      return
    }
    setExpandedFaturaId(f.id)
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function formatMonthYear(dateString: string) {
    const date = parseLocalDate(dateString)
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: '2-digit' }
    const formatted = date.toLocaleDateString('pt-BR', options)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  function formatShortMonthYear(dateString: string) {
    const date = parseLocalDate(dateString)
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
    const yearStr = date.getFullYear().toString().substring(2)
    return `${months[date.getMonth()]} ${yearStr}`
  }

  function formatDate(dateString: string) {
    return parseLocalDate(dateString).toLocaleDateString('pt-BR')
  }

  function formatLongDate(dateString: string) {
    const date = parseLocalDate(dateString)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
    return date.toLocaleDateString('pt-BR', options)
  }

  // Drag to scroll para o gráfico
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const chart = document.getElementById('invoice-bar-chart')
    if (!chart) return
    setIsDragging(true)
    setStartX(e.pageX - chart.offsetLeft)
    setScrollLeft(chart.scrollLeft)
  }

  const handleMouseLeave = () => setIsDragging(false)
  const handleMouseUp = () => setIsDragging(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    e.preventDefault()
    const chart = document.getElementById('invoice-bar-chart')
    if (!chart) return
    const x = e.pageX - chart.offsetLeft
    const walk = (x - startX) * 1.5
    chart.scrollLeft = scrollLeft - walk
  }

  useEffect(() => {
    if (selectedFatura) {
      const colEl = document.getElementById(`chart-col-${selectedFatura.id}`)
      const chartEl = document.getElementById('invoice-bar-chart')
      if (colEl && chartEl) {
        const offsetLeft = colEl.offsetLeft
        const colWidth = colEl.clientWidth
        const chartWidth = chartEl.clientWidth
        chartEl.scrollTo({
          left: offsetLeft - chartWidth / 2 + colWidth / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedFatura])

  const maxFaturaValue = useMemo(() => {
    if (faturas.length === 0) return 1
    return Math.max(
      ...faturas.map((f) =>
        f.status === 'PAGA' ? f.valorTotal : Math.max(0, f.valorTotal - (f.valorPago || 0))
      ),
      1
    )
  }, [faturas])

  const cardBrand = cartao.corHexadecimal || '#8A05BE'

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div
        className="invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ '--invoice-brand': cardBrand } as React.CSSProperties}
      >
        {/* Header do Modal */}
        <div className="invoice-modal-header" style={{ borderLeftColor: cardBrand }}>
          <div>
            <div className="invoice-modal-header__eyebrow">
              <span className="invoice-modal-header__dot" style={{ backgroundColor: cardBrand }} />
              <span>Gestão de Ciclos & Lançamentos</span>
            </div>
            <h2 className="invoice-modal-title">Faturas • {cartao.nome}</h2>
          </div>
          <button type="button" className="invoice-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="invoice-modal-loading">
            <div className="spinner"></div>
            <p>Carregando faturas...</p>
          </div>
        ) : (
          <div className="invoice-modal-content">
            {/* Bloco de Destaque da Fatura Selecionada */}
            {selectedFatura &&
              (() => {
                const valorPago = selectedFatura.valorPago || 0
                const restante = Math.max(0, selectedFatura.valorTotal - valorPago)
                const valorExibido =
                  selectedFatura.status === 'PAGA' ? selectedFatura.valorTotal : restante

                let statusLabel = 'Fatura fechada'
                if (selectedFatura.status === 'ABERTA') statusLabel = 'Fatura atual / aberta'
                else if (selectedFatura.status === 'PAGA') statusLabel = 'Fatura paga'
                else if (selectedFatura.status === 'PAGA_PARCIAL')
                  statusLabel = 'Fatura paga parcialmente'
                else if (selectedFatura.status === 'ATRASADA') statusLabel = 'Fatura atrasada'

                return (
                  <div className="invoice-detail-card">
                    <div className="invoice-detail-card__top">
                      <div className="invoice-detail-card__badges">
                        <span className="invoice-detail-card__status">{statusLabel}</span>
                        <span className="invoice-detail-card__month-pill">
                          {formatMonthYear(selectedFatura.mesReferencia)}
                        </span>
                        {valorPago > 0 && selectedFatura.status !== 'PAGA' && (
                          <span className="invoice-detail-card__prepaid">
                            {formatCurrency(valorPago)} antecipado
                          </span>
                        )}
                      </div>

                      {onPagarFatura && selectedFatura.status !== 'PAGA' && restante > 0 && (
                        <button
                          type="button"
                          className="invoice-detail-card__pay-btn"
                          onClick={() => {
                            onClose()
                            onPagarFatura(cartao)
                          }}
                        >
                          <DollarSign size={14} />
                          <span>Pagar Fatura</span>
                        </button>
                      )}
                    </div>

                    <h3 className="invoice-detail-card__value">{formatCurrency(valorExibido)}</h3>

                    {valorPago > 0 && selectedFatura.status !== 'PAGA' && (
                      <div className="invoice-detail-card__subbreakdown">
                        Total de compras: <strong>{formatCurrency(selectedFatura.valorTotal)}</strong>{' '}
                        • Restante: <strong>{formatCurrency(restante)}</strong>
                      </div>
                    )}

                    <div className="invoice-detail-card__dates">
                      <span>
                        <Calendar size={13} /> Vencimento:{' '}
                        <strong>{formatLongDate(selectedFatura.dataVencimento)}</strong>
                      </span>
                      <span className="divider">•</span>
                      <span>
                        <Lock size={13} /> Fechamento:{' '}
                        <strong>{formatLongDate(selectedFatura.dataFechamento)}</strong>
                      </span>
                    </div>
                  </div>
                )
              })()}

            {/* Banner de Projeção IA (se disponível) */}
            {projecao && projecao.statusFatura !== 'SEM_FATURA' && (
              <div
                className="invoice-ai-projection"
                style={{
                  borderLeftColor:
                    projecao.classificacao === 'ACIMA'
                      ? '#E11D48'
                      : projecao.classificacao === 'ABAIXO'
                      ? '#10B981'
                      : cardBrand
                }}
              >
                <div className="invoice-ai-projection__top">
                  <span className="invoice-ai-projection__title">
                    <Sparkles size={14} />
                    {projecao.statusFatura === 'ABERTA'
                      ? 'Projeção de Fechamento IA'
                      : 'Resultado do Fechamento'}
                  </span>
                  {projecao.mediaHistorica != null && projecao.desvioPercentual != null && (
                    <span
                      className="invoice-ai-projection__badge"
                      style={{
                        color:
                          projecao.desvioPercentual > 10
                            ? '#E11D48'
                            : projecao.desvioPercentual < -10
                            ? '#10B981'
                            : 'var(--ink)'
                      }}
                    >
                      {projecao.desvioPercentual > 0
                        ? '↑'
                        : projecao.desvioPercentual < 0
                        ? '↓'
                        : '='}{' '}
                      {Math.abs(projecao.desvioPercentual).toFixed(0)}% vs média (
                      {formatCurrency(projecao.mediaHistorica)})
                    </span>
                  )}
                </div>
                <div className="invoice-ai-projection__row">
                  <strong className="invoice-ai-projection__val">
                    {formatCurrency(
                      projecao.statusFatura === 'FECHADA' && projecao.valorRealFechado != null
                        ? projecao.valorRealFechado
                        : projecao.projecaoFechamento
                    )}
                  </strong>
                  {projecao.mensagemResumo && (
                    <span className="invoice-ai-projection__msg">{projecao.mensagemResumo}</span>
                  )}
                </div>
              </div>
            )}

            {/* GRÁFICO DE BARRAS INTERATIVO SINCRONIZADO */}
            {faturas.length > 0 && (
              <div className="invoice-chart-container">
                <div className="invoice-chart-header">
                  <h4 className="invoice-section-title">Evolução Mensal</h4>
                  <span className="invoice-chart-hint">
                    Clique em qualquer barra para abrir os itens do mês
                  </span>
                </div>
                <div
                  className="invoice-bar-chart"
                  id="invoice-bar-chart"
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  {faturas.map((f) => {
                    const valorPago = f.valorPago || 0
                    const valorEfetivo =
                      f.status === 'PAGA' ? f.valorTotal : Math.max(0, f.valorTotal - valorPago)
                    const heightPercent = (valorEfetivo / maxFaturaValue) * 78 + 12
                    const isSelected = selectedFatura?.id === f.id

                    return (
                      <div
                        key={f.id}
                        id={`chart-col-${f.id}`}
                        className={`invoice-chart-column ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectFromChart(f)}
                      >
                        <div className="chart-bar-tooltip">
                          {formatCurrency(valorEfetivo)}
                          {valorPago > 0 &&
                            f.status !== 'PAGA' &&
                            ` (Total: ${formatCurrency(f.valorTotal)})`}
                        </div>
                        <div
                          className="chart-bar-fill"
                          style={{
                            height: `${heightPercent}%`,
                            background: cardBrand
                          }}
                        />
                        <span className="chart-bar-label">
                          {formatShortMonthYear(f.mesReferencia)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ABAS HISTÓRICO VS ATUAL VS PRÓXIMAS */}
            <div className="invoice-tabs-wrapper">
              <div className="invoice-tabs">
                <button
                  type="button"
                  className={`invoice-tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
                  onClick={() => handleTabChange('historico')}
                  style={{
                    borderBottomColor: activeTab === 'historico' ? cardBrand : 'transparent'
                  }}
                >
                  Histórico ({historicoFaturas.length})
                </button>
                <button
                  type="button"
                  className={`invoice-tab-btn ${activeTab === 'atual' ? 'active' : ''}`}
                  onClick={() => handleTabChange('atual')}
                  style={{
                    borderBottomColor: activeTab === 'atual' ? cardBrand : 'transparent'
                  }}
                >
                  Fatura atual ({atualFaturas.length})
                </button>
                <button
                  type="button"
                  className={`invoice-tab-btn ${activeTab === 'proximas' ? 'active' : ''}`}
                  onClick={() => handleTabChange('proximas')}
                  style={{
                    borderBottomColor: activeTab === 'proximas' ? cardBrand : 'transparent'
                  }}
                >
                  Próximas faturas ({proximasFaturas.length})
                </button>
              </div>
            </div>

            {/* LISTAGEM DE FATURAS EXPANSÍVEIS */}
            <div className="invoice-list">
              {activeTab === 'historico' ? (
                historicoFaturas.length === 0 ? (
                  <p className="invoice-list-empty">Nenhuma fatura anterior no histórico.</p>
                ) : (
                  historicoFaturas.map((f) => renderFaturaRow(f))
                )
              ) : activeTab === 'atual' ? (
                atualFaturas.length === 0 ? (
                  <p className="invoice-list-empty">Nenhuma fatura pendente no período atual.</p>
                ) : (
                  atualFaturas.map((f) => renderFaturaRow(f))
                )
              ) : proximasFaturas.length === 0 ? (
                <p className="invoice-list-empty">Nenhuma fatura futura projetada.</p>
              ) : (
                proximasFaturas.map((f) => renderFaturaRow(f))
              )}
            </div>
          </div>
        )}
      </div>

      {anteciparTransacao && (
        <AnteciparParcelasModal
          transacao={anteciparTransacao}
          onClose={() => setAnteciparTransacao(null)}
          onSuccess={() => {
            setAnteciparTransacao(null)
            fetchFaturas()
            setFaturaItems({})
          }}
        />
      )}
    </div>
  )

  function renderFaturaRow(f: Fatura) {
    const isExpanded = expandedFaturaId === f.id
    const rawItems = faturaItems[f.id] || []
    const isLoadingItems = itemsLoading[f.id]

    const filteredItems = rawItems.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.descricao.toLowerCase().includes(searchTerm.trim().toLowerCase())
      const isParcelada = !!(item.totalParcelas && item.totalParcelas > 1)
      const matchesFilter =
        itemFilter === 'todas' ||
        (itemFilter === 'parceladas' && isParcelada) ||
        (itemFilter === 'avista' && !isParcelada)
      return matchesSearch && matchesFilter
    })

    let statusText = 'Fatura fechada'
    let statusClass = 'closed'

    const isAtual = atualFaturas.some((af) => af.id === f.id)
    const isFutura = proximasFaturas.some((pf) => pf.id === f.id)

    if (f.status === 'ABERTA') {
      if (isFutura) {
        statusText = 'Fatura aberta'
        statusClass = 'open'
      } else if (isAtual) {
        statusText = 'Fatura atual'
        statusClass = 'open'
      } else {
        statusText = 'Fatura em aberto'
        statusClass = 'open'
      }
    } else if (f.status === 'FECHADA') {
      if (isAtual) {
        statusText = 'Fatura atual / fechada'
        statusClass = 'closed'
      } else {
        statusText = 'Fatura fechada'
        statusClass = 'closed'
      }
    } else if (f.status === 'PAGA') {
      statusText = 'Fatura paga'
      statusClass = 'paid'
    } else if (f.status === 'ATRASADA') {
      statusText = 'Fatura atrasada'
      statusClass = 'overdue'
    }

    const valorPago = f.valorPago || 0
    const restante = Math.max(0, f.valorTotal - valorPago)
    const valorExibido = f.status === 'PAGA' ? f.valorTotal : restante

    return (
      <div key={f.id} className={`invoice-row-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="invoice-row-header" onClick={() => handleToggleExpand(f)}>
          <div className="invoice-row-header__left">
            <span className="invoice-row-month">{formatMonthYear(f.mesReferencia)}</span>
            <span className={`invoice-row-status invoice-row-status--${statusClass}`}>
              {statusText}
            </span>
          </div>
          <div className="invoice-row-header__right">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span className="invoice-row-value">{formatCurrency(valorExibido)}</span>
              {valorPago > 0 && f.status !== 'PAGA' && (
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  Total: {formatCurrency(f.valorTotal)}
                </span>
              )}
            </div>
            <span className="invoice-row-arrow">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="invoice-row-body">
            {/* Barra de Busca e Filtro Rápido */}
            {rawItems.length > 0 && (
              <div className="invoice-items-toolbar" onClick={(e) => e.stopPropagation()}>
                <div className="invoice-search-box">
                  <Search size={14} className="invoice-search-box__icon" />
                  <input
                    type="text"
                    placeholder="Buscar compra nesta fatura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="invoice-search-box__input"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="invoice-search-box__clear"
                      onClick={() => setSearchTerm('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="invoice-filter-pills">
                  <button
                    type="button"
                    className={`invoice-filter-pill ${itemFilter === 'todas' ? 'active' : ''}`}
                    onClick={() => setItemFilter('todas')}
                  >
                    Todas ({rawItems.length})
                  </button>
                  <button
                    type="button"
                    className={`invoice-filter-pill ${itemFilter === 'parceladas' ? 'active' : ''}`}
                    onClick={() => setItemFilter('parceladas')}
                  >
                    Parceladas
                  </button>
                  <button
                    type="button"
                    className={`invoice-filter-pill ${itemFilter === 'avista' ? 'active' : ''}`}
                    onClick={() => setItemFilter('avista')}
                  >
                    À vista (1x)
                  </button>
                </div>
              </div>
            )}

            {isLoadingItems ? (
              <div className="invoice-items-loading">Carregando itens da fatura...</div>
            ) : filteredItems.length === 0 ? (
              <div className="invoice-items-empty">
                {rawItems.length === 0
                  ? 'Nenhuma compra registrada nesta fatura.'
                  : 'Nenhuma compra corresponde ao filtro aplicado.'}
              </div>
            ) : (
              <div className="invoice-items-list">
                {filteredItems.map((item) => (
                  <div key={item.id} className="invoice-item-entry">
                    <div className="invoice-item-entry__left">
                      <span className="invoice-item-desc">{item.descricao}</span>
                      <div className="invoice-item-meta">
                        <span className="invoice-item-date">{formatDate(item.data)}</span>
                        {item.totalParcelas && item.totalParcelas > 1 ? (
                          <span className="invoice-item-installments">
                            Parcela {item.numeroParcela}/{item.totalParcelas}
                            {item.numeroParcela === item.totalParcelas && (
                              <span
                                className="invoice-item-installments__badge"
                                title="Última parcela — folga na próxima fatura"
                              >
                                ✨ Última
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="invoice-item-installments invoice-item-installments--1x">
                            1x à vista
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="invoice-item-entry__right">
                      {item.tipo === 'COMPRA_CREDITO' &&
                        item.totalParcelas &&
                        item.totalParcelas > 1 &&
                        !item.estornada && (
                          <button
                            type="button"
                            className="invoice-item-action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAnteciparTransacao(item)
                            }}
                            title="Antecipar parcelas"
                          >
                            <FastForward size={13} />
                            <span>Antecipar</span>
                          </button>
                        )}
                      <span className="invoice-item-price">{formatCurrency(item.valor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}
