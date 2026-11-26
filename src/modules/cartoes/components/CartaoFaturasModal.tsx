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
  ChevronLeft,
  ChevronRight,
  Layers,
  ShoppingBag,
  Receipt,
  X,
  Pencil,
  Check,
  RotateCcw
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
  onFaturaUpdated?: () => void
}

export function CartaoFaturasModal({
  cartao,
  projecao,
  onClose,
  onPagarFatura,
  onFaturaUpdated
}: CartaoFaturasModalProps) {
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'historico' | 'atual' | 'proximas'>('atual')
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)

  // Cache de itens por faturaId
  const [faturaItems, setFaturaItems] = useState<Record<string, Transacao[]>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [anteciparTransacao, setAnteciparTransacao] = useState<Transacao | null>(null)

  // Filtros rápidos dentro da lista de itens da fatura
  const [searchTerm, setSearchTerm] = useState('')
  const [itemFilter, setItemFilter] = useState<'todas' | 'parceladas' | 'avista'>('todas')

  // Ajuste pontual de vencimento da fatura selecionada
  const [editingVencimento, setEditingVencimento] = useState(false)
  const [vencimentoInput, setVencimentoInput] = useState('')
  const [savingVencimento, setSavingVencimento] = useState(false)
  const [vencimentoError, setVencimentoError] = useState<string | null>(null)

  useEffect(() => {
    setEditingVencimento(false)
    setVencimentoError(null)
    if (selectedFatura) {
      setVencimentoInput(selectedFatura.dataVencimento.split('T')[0])
    }
  }, [selectedFatura?.id])

  const handleOpenEditVencimento = () => {
    if (!selectedFatura) return
    setVencimentoInput(selectedFatura.dataVencimento.split('T')[0])
    setVencimentoError(null)
    setEditingVencimento(true)
  }

  const handleSaveVencimento = async (restaurarPadrao = false) => {
    if (!selectedFatura) return
    if (!restaurarPadrao && !vencimentoInput) {
      setVencimentoError('Informe uma data válida.')
      return
    }
    setSavingVencimento(true)
    setVencimentoError(null)
    try {
      const res = await cartaoService.ajustarVencimentoFatura(
        cartao.id,
        selectedFatura.id,
        restaurarPadrao ? { restaurarPadrao: true } : { dataVencimento: vencimentoInput }
      )
      const atualizada = res.data
      setFaturas((prev) => prev.map((f) => (f.id === atualizada.id ? atualizada : f)))
      setSelectedFatura(atualizada)
      setEditingVencimento(false)
      onFaturaUpdated?.()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } }
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.error ||
        'Não foi possível ajustar o vencimento desta fatura.'
      setVencimentoError(msg)
    } finally {
      setSavingVencimento(false)
    }
  }

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

      const atual = sorted.find(
        (f) => f.status !== 'PAGA' && !(f.status === 'ATRASADA' && f.rolladoOver)
      )
      const initial = atual || (sorted.length > 0 ? sorted[sorted.length - 1] : null)

      if (initial) {
        setSelectedFatura(initial)
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

  // Carrega transações automaticamente sempre que a fatura selecionada mudar
  useEffect(() => {
    if (selectedFatura) {
      loadFaturaTransactions(selectedFatura.id)
    }
  }, [selectedFatura, loadFaturaTransactions])

  // Separar faturas históricas vs atual vs próximas
  const { historicoFaturas, atualFaturas, proximasFaturas } = useMemo(() => {
    const sortedFaturas = [...faturas].sort(
      (a, b) =>
        parseLocalDate(a.mesReferencia).getTime() - parseLocalDate(b.mesReferencia).getTime()
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
      (a, b) =>
        parseLocalDate(b.mesReferencia).getTime() - parseLocalDate(a.mesReferencia).getTime()
    )
    const proxSorted = [...prox].sort(
      (a, b) =>
        parseLocalDate(a.mesReferencia).getTime() - parseLocalDate(b.mesReferencia).getTime()
    )

    return { historicoFaturas: histSorted, atualFaturas: atual, proximasFaturas: proxSorted }
  }, [faturas])

  // Sincroniza seleção de qualquer fatura com a aba de período correspondente
  const selectFaturaAndSyncTab = useCallback(
    (f: Fatura) => {
      setSelectedFatura(f)
      if (historicoFaturas.some((hf) => hf.id === f.id)) {
        setActiveTab('historico')
      } else if (atualFaturas.some((af) => af.id === f.id)) {
        setActiveTab('atual')
      } else if (proximasFaturas.some((pf) => pf.id === f.id)) {
        setActiveTab('proximas')
      }
    },
    [historicoFaturas, atualFaturas, proximasFaturas]
  )

  function handleTabChange(tab: 'historico' | 'atual' | 'proximas') {
    setActiveTab(tab)
    const list =
      tab === 'historico' ? historicoFaturas : tab === 'atual' ? atualFaturas : proximasFaturas
    if (list.length > 0) {
      setSelectedFatura(list[0])
    }
  }

  // Navegação rápida mês anterior / próximo mês na linha do tempo completa
  const currentChronologicalIndex = useMemo(() => {
    if (!selectedFatura) return -1
    return faturas.findIndex((f) => f.id === selectedFatura.id)
  }, [faturas, selectedFatura])

  const canGoPrev = currentChronologicalIndex > 0
  const canGoNext = currentChronologicalIndex >= 0 && currentChronologicalIndex < faturas.length - 1

  function handlePrevMonth() {
    if (canGoPrev) {
      selectFaturaAndSyncTab(faturas[currentChronologicalIndex - 1])
    }
  }

  function handleNextMonth() {
    if (canGoNext) {
      selectFaturaAndSyncTab(faturas[currentChronologicalIndex + 1])
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function formatMonthYear(dateString: string) {
    const date = parseLocalDate(dateString)
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
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
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
    return date.toLocaleDateString('pt-BR', options).replace('.', '')
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

  const isSelectedCurrentCycle = useMemo(() => {
    if (!selectedFatura) return false
    return atualFaturas.some((af) => af.id === selectedFatura.id)
  }, [selectedFatura, atualFaturas])

  // Lista de faturas do grupo ativo (para mostrar seletor rápido quando houver múltiplos meses no grupo)
  const activeGroupList = useMemo(() => {
    if (activeTab === 'historico') return historicoFaturas
    if (activeTab === 'atual') return atualFaturas
    return proximasFaturas
  }, [activeTab, historicoFaturas, atualFaturas, proximasFaturas])

  // Itens da fatura atualmente selecionada (painel direito)
  const rawItems = selectedFatura ? faturaItems[selectedFatura.id] || [] : []
  const isLoadingSelectedItems = selectedFatura ? !!itemsLoading[selectedFatura.id] : false

  const { parceladasCount, avistaCount, parceladasTotal, avistaTotal } = useMemo(() => {
    let pCount = 0
    let aCount = 0
    let pTotal = 0
    let aTotal = 0
    rawItems.forEach((item) => {
      if (item.totalParcelas && item.totalParcelas > 1) {
        pCount++
        pTotal += item.valor
      } else {
        aCount++
        aTotal += item.valor
      }
    })
    return {
      parceladasCount: pCount,
      avistaCount: aCount,
      parceladasTotal: pTotal,
      avistaTotal: aTotal
    }
  }, [rawItems])

  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
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
  }, [rawItems, searchTerm, itemFilter])

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div
        className="invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ '--invoice-brand': cardBrand } as React.CSSProperties}
      >
        {/* Header Superior com Segmented Control de Períodos */}
        <div className="invoice-modal-header" style={{ borderLeftColor: cardBrand }}>
          <div className="invoice-modal-header__left">
            <div className="invoice-modal-header__eyebrow">
              <span className="invoice-modal-header__dot" style={{ backgroundColor: cardBrand }} />
              <span>Gestão de Ciclos & Lançamentos</span>
            </div>
            <h2 className="invoice-modal-title">Faturas • {cartao.nome}</h2>
          </div>

          <div className="invoice-modal-header__right">
            {!loading && faturas.length > 0 && (
              <div className="invoice-period-segmented" role="tablist" aria-label="Período das faturas">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'historico'}
                  className={`invoice-period-seg-btn ${activeTab === 'historico' ? 'active' : ''}`}
                  onClick={() => handleTabChange('historico')}
                >
                  <span>Histórico</span>
                  <span className="invoice-period-seg-count">{historicoFaturas.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'atual'}
                  className={`invoice-period-seg-btn ${activeTab === 'atual' ? 'active' : ''}`}
                  onClick={() => handleTabChange('atual')}
                >
                  <span>Fatura atual</span>
                  <span className="invoice-period-seg-count">{atualFaturas.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'proximas'}
                  className={`invoice-period-seg-btn ${activeTab === 'proximas' ? 'active' : ''}`}
                  onClick={() => handleTabChange('proximas')}
                >
                  <span>Próximas</span>
                  <span className="invoice-period-seg-count">{proximasFaturas.length}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="invoice-modal-close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="invoice-modal-loading">
            <div className="spinner"></div>
            <p>Carregando faturas...</p>
          </div>
        ) : faturas.length === 0 ? (
          <div className="invoice-modal-loading">
            <Receipt size={36} />
            <p>Nenhuma fatura encontrada para este cartão.</p>
          </div>
        ) : (
          <div className="invoice-modal-split">
            {/* COLUNA ESQUERDA: Resumo da Fatura Selecionada + Gráfico Mensal + Projeção IA Contextual */}
            <aside className="invoice-modal-left">
              {/* Seletor rápido de meses quando a aba ativa possui mais de 1 fatura */}
              {activeGroupList.length > 1 && (
                <div className="invoice-month-pills-strip">
                  {activeGroupList.map((f) => {
                    const isActive = selectedFatura?.id === f.id
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`invoice-month-quick-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedFatura(f)}
                      >
                        <span>{formatShortMonthYear(f.mesReferencia)}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Card Hero de Resumo da Fatura Selecionada */}
              {selectedFatura &&
                (() => {
                  const valorPago = selectedFatura.valorPago || 0
                  const restante = Math.max(0, selectedFatura.valorTotal - valorPago)
                  const valorExibido =
                    selectedFatura.status === 'PAGA' ? selectedFatura.valorTotal : restante

                  const isAtual = atualFaturas.some((af) => af.id === selectedFatura.id)
                  const isFutura = proximasFaturas.some((pf) => pf.id === selectedFatura.id)

                  let statusLabel = 'Fatura fechada'
                  let statusTone: 'open' | 'future' | 'closed' | 'paid' | 'overdue' = 'closed'

                  if (selectedFatura.status === 'ABERTA') {
                    if (isFutura) {
                      statusLabel = 'Fatura futura'
                      statusTone = 'future'
                    } else if (isAtual) {
                      statusLabel = 'Fatura atual • aberta'
                      statusTone = 'open'
                    } else {
                      statusLabel = 'Fatura aberta'
                      statusTone = 'open'
                    }
                  } else if (selectedFatura.status === 'PAGA') {
                    statusLabel = 'Fatura paga'
                    statusTone = 'paid'
                  } else if (selectedFatura.status === 'PAGA_PARCIAL') {
                    statusLabel = 'Paga parcialmente'
                    statusTone = 'open'
                  } else if (selectedFatura.status === 'ATRASADA') {
                    statusLabel = 'Fatura atrasada'
                    statusTone = 'overdue'
                  }

                  return (
                    <div className="invoice-detail-card">
                      {/* Linha de Navegação de Mês (< Novembro de 2026 >) */}
                      <div className="invoice-detail-card__nav-row">
                        <div className="invoice-detail-card__month-heading">
                          <span className="invoice-detail-card__month-title">
                            {formatMonthYear(selectedFatura.mesReferencia)}
                          </span>
                          <span
                            className={`invoice-detail-card__status invoice-detail-card__status--${statusTone}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="invoice-detail-card__arrows">
                          <button
                            type="button"
                            className="invoice-nav-arrow-btn"
                            onClick={handlePrevMonth}
                            disabled={!canGoPrev}
                            title="Mês anterior"
                            aria-label="Mês anterior"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            className="invoice-nav-arrow-btn"
                            onClick={handleNextMonth}
                            disabled={!canGoNext}
                            title="Próximo mês"
                            aria-label="Próximo mês"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Valor Principal e Botão Pagar */}
                      <div className="invoice-detail-card__main-row">
                        <div>
                          <span className="invoice-detail-card__label">
                            {selectedFatura.status === 'PAGA'
                              ? 'Valor pago'
                              : isFutura
                              ? 'Total previsto até o momento'
                              : 'Valor a pagar'}
                          </span>
                          <h3 className="invoice-detail-card__value">
                            {formatCurrency(valorExibido)}
                          </h3>
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

                      {valorPago > 0 && selectedFatura.status !== 'PAGA' && (
                        <div className="invoice-detail-card__subbreakdown">
                          <span>
                            Compras: <strong>{formatCurrency(selectedFatura.valorTotal)}</strong>
                          </span>
                          <span className="invoice-detail-card__prepaid">
                            − {formatCurrency(valorPago)} antecipado
                          </span>
                        </div>
                      )}

                      {/* Datas em Grid de 2 Colunas */}
                      <div className="invoice-detail-card__dates-grid">
                        <div className="invoice-date-pill">
                          <Lock size={13} className="invoice-date-pill__icon" />
                          <div>
                            <span className="invoice-date-pill__label">Fechamento</span>
                            <strong className="invoice-date-pill__val">
                              {formatLongDate(selectedFatura.dataFechamento)}
                            </strong>
                          </div>
                        </div>

                        <div
                          className={`invoice-date-pill ${
                            selectedFatura.vencimentoAjustado ? 'invoice-date-pill--adjusted' : ''
                          }`}
                        >
                          <Calendar size={13} className="invoice-date-pill__icon" />
                          <div className="invoice-date-pill__body">
                            <span className="invoice-date-pill__label-row">
                              <span className="invoice-date-pill__label">Vencimento</span>
                              {selectedFatura.vencimentoAjustado && (
                                <span
                                  className="invoice-date-pill__badge"
                                  title={
                                    selectedFatura.dataVencimentoPadrao
                                      ? `Padrão do cartão: ${formatLongDate(
                                          selectedFatura.dataVencimentoPadrao
                                        )}`
                                      : `Padrão do cartão: dia ${cartao.diaVencimento}`
                                  }
                                >
                                  Ajustado
                                </span>
                              )}
                            </span>
                            <strong className="invoice-date-pill__val">
                              {formatLongDate(selectedFatura.dataVencimento)}
                            </strong>
                          </div>
                          {selectedFatura.status !== 'PAGA' && !selectedFatura.rolladoOver && (
                            <button
                              type="button"
                              className="invoice-date-pill__edit-btn"
                              onClick={handleOpenEditVencimento}
                              title="Ajustar vencimento apenas desta fatura"
                              aria-label="Ajustar vencimento desta fatura"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editor inline de ajuste pontual do vencimento */}
                      {editingVencimento && (
                        <div className="invoice-due-editor">
                          <div className="invoice-due-editor__header">
                            <span>Ajustar vencimento desta fatura</span>
                            <button
                              type="button"
                              className="invoice-due-editor__close"
                              onClick={() => {
                                setEditingVencimento(false)
                                setVencimentoError(null)
                              }}
                              disabled={savingVencimento}
                              aria-label="Cancelar ajuste"
                            >
                              <X size={13} />
                            </button>
                          </div>

                          <div className="invoice-due-editor__controls">
                            <input
                              type="date"
                              className="invoice-due-editor__input"
                              value={vencimentoInput}
                              min={selectedFatura.dataFechamento.split('T')[0]}
                              onChange={(e) => setVencimentoInput(e.target.value)}
                              disabled={savingVencimento}
                            />
                            <button
                              type="button"
                              className="invoice-due-editor__save-btn"
                              onClick={() => handleSaveVencimento(false)}
                              disabled={savingVencimento}
                              title="Salvar nova data para esta fatura"
                            >
                              <Check size={13} />
                              <span>{savingVencimento ? 'Salvando...' : 'Salvar'}</span>
                            </button>
                          </div>

                          {vencimentoError && (
                            <p className="invoice-due-editor__error">{vencimentoError}</p>
                          )}

                          <div className="invoice-due-editor__footer">
                            <span className="invoice-due-editor__hint">
                              Padrão do cartão (dia {cartao.diaVencimento}) permanece inalterado nos
                              outros meses.
                            </span>
                            {selectedFatura.vencimentoAjustado && (
                              <button
                                type="button"
                                className="invoice-due-editor__reset-btn"
                                onClick={() => handleSaveVencimento(true)}
                                disabled={savingVencimento}
                              >
                                <RotateCcw size={11} />
                                <span>Restaurar padrão</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

              {/* GRÁFICO DE BARRAS INTERATIVO SINCRONIZADO */}
              {faturas.length > 0 && (
                <div className="invoice-chart-container">
                  <div className="invoice-chart-header">
                    <h4 className="invoice-section-title">Evolução Mensal</h4>
                    <span className="invoice-chart-hint">Clique na barra para alternar o mês</span>
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
                      const heightPercent = (valorEfetivo / maxFaturaValue) * 74 + 14
                      const isSelected = selectedFatura?.id === f.id
                      const isCurrent = atualFaturas.some((af) => af.id === f.id)

                      return (
                        <div
                          key={f.id}
                          id={`chart-col-${f.id}`}
                          className={`invoice-chart-column ${isSelected ? 'selected' : ''} ${
                            isCurrent ? 'current' : ''
                          }`}
                          onClick={() => selectFaturaAndSyncTab(f)}
                        >
                          <div className="chart-bar-tooltip">{formatCurrency(valorEfetivo)}</div>
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

              {/* Banner de Projeção IA — exibido SOMENTE quando a fatura atual está selecionada */}
              {isSelectedCurrentCycle && projecao && projecao.statusFatura !== 'SEM_FATURA' && (
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
                      <Sparkles size={13} />
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
                      <p className="invoice-ai-projection__msg">{projecao.mensagemResumo}</p>
                    )}
                  </div>
                </div>
              )}
            </aside>

            {/* COLUNA DIREITA: 100% dedicada aos Lançamentos da Fatura Selecionada */}
            <section className="invoice-modal-right">
              {selectedFatura && (
                <>
                  {/* Cabeçalho Fixo da Lista de Compras */}
                  <div className="invoice-right-header">
                    <div className="invoice-right-header__top">
                      <div className="invoice-right-header__title-group">
                        <h3 className="invoice-right-header__title">
                          Lançamentos de {formatMonthYear(selectedFatura.mesReferencia)}
                        </h3>
                        <span className="invoice-right-header__count-badge">
                          {rawItems.length} {rawItems.length === 1 ? 'compra' : 'compras'}
                        </span>
                      </div>

                      {rawItems.length > 0 && (
                        <div className="invoice-right-header__breakdown">
                          <span className="invoice-mini-stat">
                            Parceladas: <strong>{formatCurrency(parceladasTotal)}</strong>
                          </span>
                          <span className="invoice-mini-stat-dot">•</span>
                          <span className="invoice-mini-stat">
                            À vista: <strong>{formatCurrency(avistaTotal)}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barra de Busca e Filtros Rápidos */}
                    <div className="invoice-items-toolbar">
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
                            aria-label="Limpar busca"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="invoice-filter-pills">
                        <button
                          type="button"
                          className={`invoice-filter-pill ${
                            itemFilter === 'todas' ? 'active' : ''
                          }`}
                          onClick={() => setItemFilter('todas')}
                        >
                          Todas ({rawItems.length})
                        </button>
                        <button
                          type="button"
                          className={`invoice-filter-pill ${
                            itemFilter === 'parceladas' ? 'active' : ''
                          }`}
                          onClick={() => setItemFilter('parceladas')}
                        >
                          Parceladas ({parceladasCount})
                        </button>
                        <button
                          type="button"
                          className={`invoice-filter-pill ${
                            itemFilter === 'avista' ? 'active' : ''
                          }`}
                          onClick={() => setItemFilter('avista')}
                        >
                          À vista ({avistaCount})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Área Rolável Dedicada de Transações */}
                  <div className="invoice-items-scroll">
                    {isLoadingSelectedItems ? (
                      <div className="invoice-items-state">
                        <div className="spinner"></div>
                        <span>Carregando lançamentos de {formatMonthYear(selectedFatura.mesReferencia)}...</span>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="invoice-items-state">
                        <ShoppingBag size={28} />
                        <span>
                          {rawItems.length === 0
                            ? 'Nenhuma compra registrada nesta fatura.'
                            : 'Nenhuma compra corresponde ao filtro aplicado.'}
                        </span>
                      </div>
                    ) : (
                      <div className="invoice-items-list">
                        {filteredItems.map((item) => {
                          const isParcelada = !!(item.totalParcelas && item.totalParcelas > 1)
                          const isLastInstallment =
                            isParcelada && item.numeroParcela === item.totalParcelas

                          return (
                            <div key={item.id} className="invoice-item-entry">
                              <div className="invoice-item-entry__left">
                                <div
                                  className={`invoice-item-icon ${
                                    isParcelada
                                      ? 'invoice-item-icon--installment'
                                      : 'invoice-item-icon--single'
                                  }`}
                                >
                                  {isParcelada ? <Layers size={15} /> : <ShoppingBag size={15} />}
                                </div>

                                <div className="invoice-item-info">
                                  <span className="invoice-item-desc" title={item.descricao}>
                                    {item.descricao}
                                  </span>
                                  <div className="invoice-item-meta">
                                    <span className="invoice-item-date">
                                      {formatDate(item.data)}
                                    </span>
                                    {isParcelada ? (
                                      <span className="invoice-item-installments">
                                        Parcela {item.numeroParcela}/{item.totalParcelas}
                                        {isLastInstallment && (
                                          <span
                                            className="invoice-item-installments__badge"
                                            title="Última parcela — libera limite na próxima fatura"
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
                              </div>

                              <div className="invoice-item-entry__right">
                                {item.tipo === 'COMPRA_CREDITO' &&
                                  isParcelada &&
                                  !item.estornada && (
                                    <button
                                      type="button"
                                      className="invoice-item-action-btn"
                                      onClick={() => setAnteciparTransacao(item)}
                                      title="Antecipar parcelas"
                                    >
                                      <FastForward size={13} />
                                      <span>Antecipar</span>
                                    </button>
                                  )}
                                <span className="invoice-item-price">
                                  {formatCurrency(item.valor)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
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
}
