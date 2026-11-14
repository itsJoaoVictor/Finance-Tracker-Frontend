import { useState, useRef, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Equal,
  Eye,
  EyeOff,
  Receipt,
  DollarSign,
  Plus,
  MoreHorizontal,
  Sparkles,
  AlertTriangle,
  Calendar,
  Landmark,
  Pencil,
  Trash2
} from 'lucide-react'
import { Cartao, Conta, ProjecaoCartao } from '../../../types'
import { IaInsight, iaService } from '../../../services/iaService'
import '../cartoes.css'

interface CreditCardProps {
  cartao: Cartao
  contas: Conta[]
  insights?: IaInsight[]
  projecoes?: ProjecaoCartao[]
  onEdit: (cartao: Cartao) => void
  onDelete: (cartao: Cartao) => void
  onViewFaturas: (cartao: Cartao) => void
  onNovaTransacao: (cartao: Cartao) => void
  onPagarFatura: (cartao: Cartao) => void
  onRefreshInsights?: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  const cleanStr = dateStr.split('T')[0]
  const parts = cleanStr.split('-').map(Number)
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  return new Date(dateStr)
}

export function CreditCard({
  cartao,
  contas,
  insights = [],
  projecoes = [],
  onEdit,
  onDelete,
  onViewFaturas,
  onNovaTransacao,
  onPagarFatura,
  onRefreshInsights
}: CreditCardProps) {
  const [limitVisible, setLimitVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [insightTooltipOpen, setInsightTooltipOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const contaVinculada = contas.find((c) => c.id === cartao.contaId)
  const nomeConta = contaVinculada ? contaVinculada.nome : 'Sem conta'

  const projecao = projecoes.find((p) => p.cartaoId === cartao.id)
  const statusExibido: string = cartao.faturaStatus ?? projecao?.statusFatura ?? 'ABERTA'
  const isFaturaExibidaFechada = statusExibido === 'FECHADA'

  const accentColor =
    projecao?.classificacao === 'ACIMA'
      ? '#E11D48'
      : projecao?.classificacao === 'ABAIXO'
      ? '#10B981'
      : '#3B82F6'

  const limiteConsumido = Math.max(0, cartao.limite - cartao.limiteDisponivel)
  const porcentagemConsumida =
    cartao.limite > 0 ? Math.min((limiteConsumido / cartao.limite) * 100, 100) : 0

  const cardColor = cartao.corHexadecimal || '#8A05BE'

  // Filtra insights vinculados a este cartão
  const cardInsights = insights.filter((ins) => {
    if (
      ins.tipo !== 'CARTAO_PREVISAO' &&
      ins.tipo !== 'ESTOURO_FATURA' &&
      ins.tipo !== 'MELHOR_CARTAO' &&
      ins.tipo !== 'AVISO_FECHAMENTO' &&
      ins.tipo !== 'OTIMIZACAO_PARCELAMENTO'
    )
      return false
    if (ins.tipo === 'CARTAO_PREVISAO' && projecao) return false
    if (!ins.metadados) return false
    try {
      const meta = JSON.parse(ins.metadados)
      return meta.cartaoId === cartao.id
    } catch {
      return false
    }
  })

  const melhorCartaoInsight = cardInsights.find((i) => i.tipo === 'MELHOR_CARTAO')
  const alertaInsight = cardInsights.find((i) => i.tipo !== 'MELHOR_CARTAO')
  const activeInsight = melhorCartaoInsight || alertaInsight

  const mesRefFormatado = cartao.faturaMesReferencia
    ? parseLocalDate(cartao.faturaMesReferencia).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric'
      })
    : ''

  return (
    <article
      className="fintech-card-wrapper"
      onClick={() => onViewFaturas(cartao)}
      style={{ '--card-brand': cardColor } as React.CSSProperties}
    >
      {/* CARTÃO FÍSICO PREMIUM */}
      <div className="physical-card">
        <div className="physical-card__glow" />

        {/* Topo do cartão: Identificação + Pill de Insight + Menu */}
        <div className="physical-card__top">
          <div className="physical-card__brand-group">
            <span className="physical-card__brand-dot" style={{ backgroundColor: cardColor }} />
            <span className="physical-card__brand">{cartao.nome}</span>
          </div>

          <div className="physical-card__top-right">
            {activeInsight && (
              <button
                type="button"
                className={`physical-card__smart-pill ${
                  melhorCartaoInsight
                    ? 'physical-card__smart-pill--best'
                    : 'physical-card__smart-pill--alert'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setInsightTooltipOpen((v) => !v)
                }}
                title={activeInsight.mensagem}
              >
                {melhorCartaoInsight ? (
                  <>
                    <Sparkles size={12} />
                    <span>Melhor Hoje</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} />
                    <span>Alerta IA</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              className="physical-card__options-btn"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((o) => !o)
              }}
              aria-label="Opções do cartão"
              title="Mais opções"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Popover compacto se o usuário clicar na pill da IA */}
        {activeInsight && insightTooltipOpen && (
          <div
            className="physical-card__insight-popover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="physical-card__insight-popover-header">
              <span>🤖 {activeInsight.titulo}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {activeInsight.tipo !== 'MELHOR_CARTAO' &&
                  activeInsight.tipo !== 'AVISO_FECHAMENTO' && (
                    <button
                      type="button"
                      className="physical-card__insight-dismiss"
                      onClick={async () => {
                        try {
                          await iaService.marcarComoLido(activeInsight.id)
                          setInsightTooltipOpen(false)
                          if (onRefreshInsights) onRefreshInsights()
                        } catch {
                          /* ignore */
                        }
                      }}
                    >
                      Dispensar
                    </button>
                  )}
                <button
                  type="button"
                  className="physical-card__insight-close"
                  onClick={() => setInsightTooltipOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="physical-card__insight-popover-msg">{activeInsight.mensagem}</p>
          </div>
        )}

        {/* Meio: Chip metálico + Contactless + Limite Disponível */}
        <div className="physical-card__middle">
          <div className="physical-card__limit-info">
            <span className="physical-card__label">Limite Disponível</span>
            <div className="physical-card__limit-val">
              <span>{limitVisible ? formatCurrency(cartao.limiteDisponivel) : 'R$ ••••••'}</span>
              <button
                type="button"
                className="physical-card__toggle-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setLimitVisible((v) => !v)
                }}
                aria-label={limitVisible ? 'Ocultar limite' : 'Exibir limite'}
                title={limitVisible ? 'Ocultar limite' : 'Exibir limite'}
              >
                {limitVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>

          <div className="physical-card__chip-row">
            <div className="physical-card__chip" />
            <div className="physical-card__contactless">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12a10 10 0 0 1 5-8.66" />
                <path d="M3 12a14 14 0 0 1 7-12.12" />
                <path d="M7 12a6 6 0 0 1 3-5.19" />
                <circle cx="11" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>

        {/* Rodapé do cartão físico: Conta vinculada e Datas */}
        <div className="physical-card__bottom">
          <div className="physical-card__account-pill">
            <Landmark size={12} />
            <span>{nomeConta}</span>
          </div>
          <div className="physical-card__dates-pills">
            <span className="physical-card__date-chip">
              Fecha dia <strong>{cartao.diaFechamento}</strong>
            </span>
            <span className="physical-card__date-chip">
              Vence dia <strong>{cartao.diaVencimento}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* PAINEL DE DETALHES E AÇÕES RÁPIDAS (SIMÉTRICO) */}
      <div className="card-details-panel">
        {/* Bloco padronizado de Fatura / Projeção IA */}
        <div
          className="card-projecao-banner"
          style={{ '--accent': accentColor } as React.CSSProperties}
        >
          <div className="card-projecao-banner__header">
            <span className="card-projecao-banner__label">
              {isFaturaExibidaFechada ? 'Fatura Fechada' : 'Fatura & Projeção'}
              {mesRefFormatado && (
                <span className="card-projecao-banner__ref"> • {mesRefFormatado}</span>
              )}
            </span>
            <span
              className={`fatura-badge ${
                isFaturaExibidaFechada ? 'fatura-badge--closed' : 'fatura-badge--open'
              }`}
            >
              {isFaturaExibidaFechada ? '🔒 Fechada' : '🔓 Aberta'}
            </span>
          </div>

          {projecao ? (
            <>
              {!isFaturaExibidaFechada && projecao.valorAtualNoMes > 0 ? (
                <div className="card-projecao-banner__valores">
                  <div className="card-projecao-banner__valor-item">
                    <span className="card-projecao-banner__valor-label">Gasto Atual</span>
                    <span className="card-projecao-banner__valor-atual">
                      {limitVisible ? formatCurrency(projecao.valorAtualNoMes) : 'R$ ••••'}
                    </span>
                  </div>
                  <div className="card-projecao-banner__valor-sep">→</div>
                  <div className="card-projecao-banner__valor-item">
                    <span className="card-projecao-banner__valor-label">Projeção IA</span>
                    <span className="card-projecao-banner__valor-projetado">
                      {limitVisible ? formatCurrency(projecao.projecaoFechamento) : 'R$ ••••'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="card-projecao-banner__valores">
                  <div className="card-projecao-banner__valor-item">
                    <span className="card-projecao-banner__valor-label">
                      {isFaturaExibidaFechada ? 'Total Fechado' : 'Fatura Estimada'}
                    </span>
                    <span className="card-projecao-banner__valor-unico">
                      {limitVisible
                        ? formatCurrency(
                            isFaturaExibidaFechada && projecao.valorRealFechado != null
                              ? projecao.valorRealFechado
                              : projecao.projecaoFechamento
                          )
                        : 'R$ ••••'}
                    </span>
                  </div>
                </div>
              )}

              <div className="card-projecao-banner__meta-row">
                {projecao.mediaHistorica != null && projecao.desvioPercentual != null ? (
                  <div className="card-projecao-banner__classificacao">
                    {projecao.classificacao === 'ACIMA' ? (
                      <TrendingUp size={13} color="#E11D48" />
                    ) : projecao.classificacao === 'ABAIXO' ? (
                      <TrendingDown size={13} color="#10B981" />
                    ) : (
                      <Equal size={13} color="var(--muted)" />
                    )}
                    <span>
                      <strong
                        style={{
                          color: projecao.classificacao === 'ACIMA' ? '#E11D48' : '#10B981'
                        }}
                      >
                        {Math.abs(projecao.desvioPercentual).toFixed(0)}%{' '}
                        {projecao.classificacao === 'ACIMA' ? 'acima' : 'abaixo'}
                      </strong>{' '}
                      da média ({formatCurrency(projecao.mediaHistorica)})
                    </span>
                  </div>
                ) : (
                  <span className="card-projecao-banner__progresso-dias">
                     Acompanhamento inteligente ativo
                  </span>
                )}

                {!isFaturaExibidaFechada && (
                  <span className="card-projecao-banner__progresso-dias">
                    <Calendar size={11} />
                    {Math.max(0, projecao.diasNoMes - projecao.diasPassados)}d p/ fechar
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="card-projecao-banner__valores">
              <div className="card-projecao-banner__valor-item">
                <span className="card-projecao-banner__valor-label">Fatura Estimada</span>
                <span className="card-projecao-banner__valor-unico">
                  {limitVisible ? formatCurrency(cartao.faturaEstimada || 0) : 'R$ ••••'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Uso do Limite Global do Cartão */}
        <div className="card-limit-usage">
          <div className="card-limit-usage__labels">
            <span className="card-limit-usage__consumed">
              Consumido:{' '}
              <strong>{limitVisible ? formatCurrency(limiteConsumido) : 'R$ ••••'}</strong>
            </span>
            <span className="card-limit-usage__total">
              de {limitVisible ? formatCurrency(cartao.limite) : 'R$ ••••'} (
              <strong>{porcentagemConsumida.toFixed(0)}%</strong>)
            </span>
          </div>
          <div className="card-details-panel__progress-bar">
            <div
              className="card-details-panel__progress-fill"
              style={{
                background:
                  porcentagemConsumida > 85
                    ? '#E11D48'
                    : porcentagemConsumida > 60
                    ? '#F59E0B'
                    : cardColor,
                width: `${porcentagemConsumida}%`
              }}
            />
          </div>
        </div>

        {/* Barra de Ações Rápidas Visíveis */}
        <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="card-quick-action-btn card-quick-action-btn--primary"
            onClick={() => onViewFaturas(cartao)}
          >
            <Receipt size={14} />
            <span>Faturas</span>
          </button>
          <button
            type="button"
            className="card-quick-action-btn"
            onClick={() => onPagarFatura(cartao)}
          >
            <DollarSign size={14} />
            <span>Pagar</span>
          </button>
          <button
            type="button"
            className="card-quick-action-btn"
            onClick={() => onNovaTransacao(cartao)}
          >
            <Plus size={14} />
            <span>Gasto</span>
          </button>
        </div>
      </div>

      {/* Menu dropdown para ações administrativas (Editar / Excluir) */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="account-card__dropdown"
          style={{ position: 'absolute', top: 52, right: 16, zIndex: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="account-card__dropdown-item"
            onClick={() => {
              setMenuOpen(false)
              onPagarFatura(cartao)
            }}
          >
            <DollarSign size={15} /> Pagar Fatura
          </button>
          <button
            type="button"
            className="account-card__dropdown-item"
            onClick={() => {
              setMenuOpen(false)
              onNovaTransacao(cartao)
            }}
          >
            <Plus size={15} /> Nova Transação
          </button>
          <button
            type="button"
            className="account-card__dropdown-item"
            onClick={() => {
              setMenuOpen(false)
              onEdit(cartao)
            }}
          >
            <Pencil size={15} /> Editar Cartão
          </button>
          <button
            type="button"
            className="account-card__dropdown-item account-card__dropdown-item--danger"
            onClick={() => {
              setMenuOpen(false)
              onDelete(cartao)
            }}
          >
            <Trash2 size={15} /> Excluir Cartão
          </button>
        </div>
      )}
    </article>
  )
}
