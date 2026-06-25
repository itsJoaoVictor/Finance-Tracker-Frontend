import { useEffect, useState, useMemo } from 'react'
import { Cartao, Fatura, ProjecaoCartao, Transacao } from '../../../types'
import { cartaoService } from '../../../services/cartaoService'
import { transacaoService } from '../../../services/transacaoService'
import '../cartoes.css'
import './CartaoFaturasModal.css'

// Helper to parse dates in local timezone (avoiding UTC timezone shift issues)
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
}

export function CartaoFaturasModal({ cartao, projecao, onClose }: CartaoFaturasModalProps) {
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'historico' | 'atual' | 'proximas'>('atual')
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)
  
  // Cache de itens por faturaId
  const [faturaItems, setFaturaItems] = useState<Record<string, Transacao[]>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null)

  // Carregar faturas do cartão
  useEffect(() => {
    async function fetchFaturas() {
      setLoading(true)
      try {
        const res = await cartaoService.getFaturas(cartao.id)
        // Ordena por mesReferencia crescente para o gráfico de barras
        const sorted = [...res.data].sort(
          (a, b) => parseLocalDate(a.mesReferencia).getTime() - parseLocalDate(b.mesReferencia).getTime()
        )
        setFaturas(sorted)

        // Define fatura selecionada como a fatura ativa (primeira que ainda não está paga)
        const atual = sorted.find((f) => f.status !== 'PAGA')

        if (atual) {
          setSelectedFatura(atual)
        } else if (sorted.length > 0) {
          setSelectedFatura(sorted[sorted.length - 1])
        }
      } catch (err) {
        console.error('Erro ao buscar faturas', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFaturas()
  }, [cartao.id])

  // Separar faturas históricas vs atual vs próximas
  const { historicoFaturas, atualFaturas, proximasFaturas } = useMemo(() => {
    // Ordena faturas: ordem cronológica
    const sortedFaturas = [...faturas].sort(
      (a, b) => new Date(a.mesReferencia).getTime() - new Date(b.mesReferencia).getTime()
    )

    // Encontra o índice da primeira fatura que ainda não foi totalmente paga
    const atualIndex = sortedFaturas.findIndex((f) => {
      return f.status !== 'PAGA'
    })

    const hist: Fatura[] = []
    const atual: Fatura[] = []
    const prox: Fatura[] = []

    if (atualIndex === -1) {
      // Se todas já venceram/estão pagas, a última vai para a atual e o restante para o histórico
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

    // Ordenar histórico decrescente para a lista
    const histSorted = [...hist].sort(
      (a, b) => new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
    )
    // Ordenar próximas crescente
    const proxSorted = [...prox].sort(
      (a, b) => new Date(a.mesReferencia).getTime() - new Date(b.mesReferencia).getTime()
    )

    return { historicoFaturas: histSorted, atualFaturas: atual, proximasFaturas: proxSorted }
  }, [faturas])

  // Buscar itens da fatura quando expandir
  async function handleToggleExpand(faturaId: string) {
    if (expandedFaturaId === faturaId) {
      setExpandedFaturaId(null)
      return;
    }
    setExpandedFaturaId(faturaId)

    // Se já tiver no cache, não busca de novo
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
  }

  // Formatações utilitárias
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

  // Drag to scroll logic para o gráfico
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const chart = document.getElementById('invoice-bar-chart');
    if (!chart) return;
    setIsDragging(true);
    setStartX(e.pageX - chart.offsetLeft);
    setScrollLeft(chart.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const chart = document.getElementById('invoice-bar-chart');
    if (!chart) return;
    const x = e.pageX - chart.offsetLeft;
    const walk = (x - startX) * 1.5;
    chart.scrollLeft = scrollLeft - walk;
  };

  // Efeito para centralizar a coluna selecionada no gráfico
  useEffect(() => {
    if (selectedFatura) {
      const colEl = document.getElementById(`chart-col-${selectedFatura.id}`);
      const chartEl = document.getElementById('invoice-bar-chart');
      if (colEl && chartEl) {
        const offsetLeft = colEl.offsetLeft;
        const colWidth = colEl.clientWidth;
        const chartWidth = chartEl.clientWidth;
        chartEl.scrollTo({
          left: offsetLeft - chartWidth / 2 + colWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedFatura]);

  const maxFaturaValue = useMemo(() => {
    if (faturas.length === 0) return 1
    return Math.max(...faturas.map((f) => f.valorTotal), 1)
  }, [faturas])

  // Formatar data em extenso
  function formatLongDate(dateString: string) {
    const date = parseLocalDate(dateString)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
    return date.toLocaleDateString('pt-BR', options)
  }

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header do Modal */}
        <div className="invoice-modal-header" style={{ borderLeftColor: cartao.corHexadecimal || '#8A05BE' }}>
          <div>
            <h2 className="invoice-modal-title">Faturas do Cartão • {cartao.nome}</h2>
            <p className="invoice-modal-subtitle">Acompanhe seus ciclos e gastos detalhados</p>
          </div>
          <button className="invoice-modal-close" onClick={onClose}>✕</button>
        </div>
 
        {loading ? (
          <div className="invoice-modal-loading">
            <div className="spinner"></div>
            <p>Carregando faturas...</p>
          </div>
        ) : (
          <div className="invoice-modal-content">
            {/* Bloco de Destaque da Fatura Selecionada */}
            {selectedFatura && (
              <div className="invoice-detail-card">
                <span className="invoice-detail-card__status">
                  {selectedFatura.status === 'ABERTA' ? 'Fatura atual / aberta' : 'Fatura fechada'}
                </span>
                <h3 className="invoice-detail-card__value">
                  {formatCurrency(selectedFatura.valorTotal)}
                </h3>
                <div className="invoice-detail-card__dates">
                  <span>📅 Vencimento: {formatLongDate(selectedFatura.dataVencimento)}</span>
                  <span className="divider">•</span>
                  <span>🔒 Fechamento: {formatLongDate(selectedFatura.dataFechamento)}</span>
                </div>
              </div>
            )}

            {/* Banner de Projeção IA (se disponível) */}
            {projecao && projecao.statusFatura !== 'SEM_FATURA' && (
              <div
                className="card-projecao-banner"
                style={{
                  borderLeftColor:
                    projecao.classificacao === 'ACIMA' ? '#E63946' :
                    projecao.classificacao === 'ABAIXO' ? '#22c55e' :
                    projecao.classificacao === 'DENTRO' ? '#8A05BE' :
                    '#999'
                }}
              >
                <div className="card-projecao-banner__header">
                  <span className="card-projecao-banner__icon">🤖</span>
                  <span className="card-projecao-banner__label">
                    {projecao.statusFatura === 'ABERTA' ? 'Projeção de Fechamento' : 'Análise Histórica'}
                  </span>
                  {projecao.mesesHistorico != null && (
                    <span className="card-projecao-banner__periodo">
                      Média de {projecao.mesesHistorico} meses
                    </span>
                  )}
                </div>
                <div className="card-projecao-banner__valor">
                  {formatCurrency(
                    projecao.statusFatura === 'FECHADA' && projecao.valorRealFechado != null
                      ? projecao.valorRealFechado
                      : projecao.projecaoFechamento
                  )}
                </div>
                {projecao.mediaHistorica != null && projecao.desvioPercentual != null && (
                  <div
                    className="card-projecao-banner__comparacao"
                    style={{
                      color:
                        projecao.desvioPercentual > 10 ? '#E63946' :
                        projecao.desvioPercentual < -10 ? '#22c55e' :
                        'var(--ink)'
                    }}
                  >
                    {projecao.desvioPercentual > 0 ? '↑' : projecao.desvioPercentual < 0 ? '↓' : '='}{' '}
                    {Math.abs(projecao.desvioPercentual).toFixed(0)}% vs média ({formatCurrency(projecao.mediaHistorica)})
                  </div>
                )}
                <div className="card-projecao-banner__mensagem">{projecao.mensagemResumo}</div>
              </div>
            )}
 
            {/* GRÁFICO DE BARRAS SIMPLES E PREMIUM */}
            {faturas.length > 0 && (
              <div className="invoice-chart-container">
                <h4 className="invoice-section-title">Evolução Mensal</h4>
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
                    const heightPercent = (f.valorTotal / maxFaturaValue) * 80 + 10 // Altura min 10% para exibir barra fina mesmo zerada
                    const isSelected = selectedFatura?.id === f.id
                    
                    return (
                      <div 
                        key={f.id} 
                        id={`chart-col-${f.id}`}
                        className={`invoice-chart-column ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedFatura(f)}
                      >
                        <div className="chart-bar-tooltip">{formatCurrency(f.valorTotal)}</div>
                        <div 
                          className="chart-bar-fill" 
                          style={{ 
                            height: `${heightPercent}%`,
                            background: cartao.corHexadecimal || '#8A05BE'
                          }}
                        />
                        <span className="chart-bar-label">{formatShortMonthYear(f.mesReferencia)}</span>
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
                  className={`invoice-tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
                  onClick={() => setActiveTab('historico')}
                  style={{ 
                    borderBottomColor: activeTab === 'historico' ? (cartao.corHexadecimal || '#8A05BE') : 'transparent',
                    color: activeTab === 'historico' ? 'var(--ink)' : 'var(--text-muted)'
                  }}
                >
                  Histórico
                </button>
                <button 
                  className={`invoice-tab-btn ${activeTab === 'atual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('atual')}
                  style={{ 
                    borderBottomColor: activeTab === 'atual' ? (cartao.corHexadecimal || '#8A05BE') : 'transparent',
                    color: activeTab === 'atual' ? 'var(--ink)' : 'var(--text-muted)'
                  }}
                >
                  Fatura atual
                </button>
                <button 
                  className={`invoice-tab-btn ${activeTab === 'proximas' ? 'active' : ''}`}
                  onClick={() => setActiveTab('proximas')}
                  style={{ 
                    borderBottomColor: activeTab === 'proximas' ? (cartao.corHexadecimal || '#8A05BE') : 'transparent',
                    color: activeTab === 'proximas' ? 'var(--ink)' : 'var(--text-muted)'
                  }}
                >
                  Próximas faturas
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
              ) : (
                proximasFaturas.length === 0 ? (
                  <p className="invoice-list-empty">Nenhuma fatura futura projetada.</p>
                ) : (
                  proximasFaturas.map((f) => renderFaturaRow(f))
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Renderizar linha individual da Fatura
  function renderFaturaRow(f: Fatura) {
    const isExpanded = expandedFaturaId === f.id
    const items = faturaItems[f.id] || []
    const isLoadingItems = itemsLoading[f.id]

    // Formata o status da fatura
    let statusText = 'Fatura fechada'
    let statusClass = 'closed'

    const isAtual = atualFaturas.some(af => af.id === f.id)
    const isFutura = proximasFaturas.some(pf => pf.id === f.id)

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

    return (
      <div key={f.id} className={`invoice-row-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="invoice-row-header" onClick={() => handleToggleExpand(f.id)}>
          <div className="invoice-row-header__left">
            <span className="invoice-row-month">{formatMonthYear(f.mesReferencia)}</span>
            <span className={`invoice-row-status invoice-row-status--${statusClass}`}>{statusText}</span>
          </div>
          <div className="invoice-row-header__right">
            <span className="invoice-row-value">{formatCurrency(f.valorTotal)}</span>
            <span className="invoice-row-arrow">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>

        {/* Corpo Expansível (Transações/Itens) */}
        {isExpanded && (
          <div className="invoice-row-body">
            {isLoadingItems ? (
              <div className="invoice-items-loading">Carregando itens...</div>
            ) : items.length === 0 ? (
              <div className="invoice-items-empty">Nenhuma compra nesta fatura.</div>
            ) : (
              <div className="invoice-items-list">
                {items.map((item) => (
                  <div key={item.id} className="invoice-item-entry">
                    <div className="invoice-item-entry__left">
                      <span className="invoice-item-desc">{item.descricao}</span>
                      {item.totalParcelas && item.totalParcelas > 1 && (
                        <span className="invoice-item-installments">
                          Parcela {item.numeroParcela} de {item.totalParcelas}
                        </span>
                      )}
                      <span className="invoice-item-date">{formatDate(item.data)}</span>
                    </div>
                    <div className="invoice-item-entry__right">
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
