import { useState, useMemo } from 'react'
import {
  Sparkles,
  CheckCircle2,
  CreditCard,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
  CheckCheck,
  Receipt
} from 'lucide-react'
import { FolgaLimiteItem } from '../../../services/iaService'
import { Cartao } from '../../../types/cartoes'
import './FolgaLimiteSection.css'

interface FolgaLimiteSectionProps {
  items: FolgaLimiteItem[]
  cartoes?: Cartao[]
  onDismiss: (id: string) => void
  onDismissAll?: () => void
}

function getFallbackColor(nome: string): string {
  const n = (nome || '').toLowerCase()
  if (n.includes('nubank')) return '#820AD1'
  if (n.includes('banco do brasil') || n.includes('bb')) return '#F9DD16'
  if (n.includes('inter')) return '#FF7A00'
  if (n.includes('itaú') || n.includes('itau')) return '#EC7000'
  if (n.includes('bradesco')) return '#CC092F'
  if (n.includes('santander')) return '#CC0000'
  if (n.includes('c6')) return '#242424'
  if (n.includes('caixa')) return '#005CA9'
  return '#10b981'
}

export function FolgaLimiteSection({
  items,
  cartoes = [],
  onDismiss,
  onDismissAll
}: FolgaLimiteSectionProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items])
  const safeCartoes = useMemo(() => (Array.isArray(cartoes) ? cartoes : []), [cartoes])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // Mapa de cores dos cartões
  const cartaoColorMap = useMemo(() => {
    const map = new Map<string, string>()
    safeCartoes.forEach((c) => {
      if (c && c.id && c.corHexadecimal) {
        map.set(c.id, c.corHexadecimal)
      }
    })
    return map
  }, [safeCartoes])

  const getColor = (cartaoId: string, cartaoNome: string) => {
    return cartaoColorMap.get(cartaoId) || getFallbackColor(cartaoNome)
  }

  const { parcelamentoItems, aVistaItems } = useMemo(() => {
    const parcelamentos: FolgaLimiteItem[] = []
    const aVista: FolgaLimiteItem[] = []
    safeItems.forEach((item) => {
      if (item?.tipo === 'A_VISTA_AGRUPADO') {
        aVista.push(item)
      } else {
        parcelamentos.push(item)
      }
    })
    return { parcelamentoItems: parcelamentos, aVistaItems: aVista }
  }, [safeItems])

  const orderedItems = useMemo(
    () => [...parcelamentoItems, ...aVistaItems],
    [parcelamentoItems, aVistaItems]
  )

  const totalFolgado = useMemo(
    () => parcelamentoItems.reduce((acc, item) => acc + (Number(item?.impactoMensal) || 0), 0),
    [parcelamentoItems]
  )

  const totalAVista = useMemo(
    () => aVistaItems.reduce((acc, item) => acc + (Number(item?.impactoMensal) || 0), 0),
    [aVistaItems]
  )

  const totalComprasAVista = useMemo(
    () =>
      aVistaItems.reduce(
        (acc, item) => acc + (Number(item?.quantidadeCompras) || item?.detalhes?.length || 1),
        0
      ),
    [aVistaItems]
  )

  // Agrupamento por cartão para parcelamentos quitados
  const breakdownPorCartao = useMemo(() => {
    const map = new Map<
      string,
      { cartaoId: string; cartaoNome: string; total: number; cor: string; count: number }
    >()
    parcelamentoItems.forEach((item) => {
      const cor = getColor(item.cartaoId, item.cartaoNome)
      const existing = map.get(item.cartaoId) || {
        cartaoId: item.cartaoId,
        cartaoNome: item.cartaoNome || 'Cartão',
        total: 0,
        cor,
        count: 0
      }
      existing.total += Number(item.impactoMensal) || 0
      existing.count += 1
      map.set(item.cartaoId, existing)
    })
    return Array.from(map.values())
  }, [parcelamentoItems, cartaoColorMap])

  const hasParcelamentos = parcelamentoItems.length > 0
  const hasAVista = aVistaItems.length > 0

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // O early return só pode ocorrer DEPOIS de todos os hooks do React
  if (safeItems.length === 0) {
    return null
  }

  return (
    <section className="folga-container" aria-label="Folga de Limite Financeiro">
      {/* Hero Banner Moderno */}
      <div className={`folga-hero ${!hasParcelamentos && hasAVista ? 'folga-hero--avista-only' : ''}`}>
        <div className="folga-hero__glow" />

        <div className="folga-hero__top">
          <div className="folga-hero__badge">
            <Sparkles className="folga-hero__badge-icon" size={14} />
            <span>
              {hasParcelamentos ? 'Alívio Financeiro Detectado' : 'Raio-X da Próxima Fatura'}
            </span>
          </div>

          {onDismissAll && (
            <button
              type="button"
              className="folga-hero__dismiss-all"
              onClick={onDismissAll}
              title="Dispensar todos os avisos de folga"
            >
              <CheckCheck size={14} />
              <span>Dispensar todos</span>
            </button>
          )}
        </div>

        <div className="folga-hero__content">
          <div className="folga-hero__titles">
            <h2 className="folga-hero__title">
              {hasParcelamentos
                ? 'Folga de Limite no Próximo Ciclo'
                : 'Compras à Vista desta Fatura'}
            </h2>
            <p className="folga-hero__subtitle">
              {hasParcelamentos
                ? 'Estes parcelamentos chegam ao fim nesta fatura. A partir do próximo ciclo, esse valor deixa de ser cobrado e fica livre no seu bolso!'
                : 'Estas compras de parcela única (1x) não geram parcelas automáticas nas próximas faturas. Assinaturas recorrentes não estão incluídas.'}
            </p>
          </div>

          {hasParcelamentos ? (
            <div className="folga-hero__metric-box">
              <div className="folga-hero__metric-label">Economia mensal garantida</div>
              <div className="folga-hero__metric-value">
                +{formatCurrency(totalFolgado)}
                <span className="folga-hero__metric-cycle">/mês</span>
              </div>
              <div className="folga-hero__metric-count">
                <CheckCircle2 size={13} />
                <span>
                  {parcelamentoItems.length}{' '}
                  {parcelamentoItems.length === 1
                    ? 'parcelamento quitado'
                    : 'parcelamentos quitados'}
                </span>
              </div>
            </div>
          ) : (
            <div className="folga-hero__metric-box">
              <div className="folga-hero__metric-label">Não parcelado nesta fatura</div>
              <div className="folga-hero__metric-value">
                {formatCurrency(totalAVista)}
                <span className="folga-hero__metric-cycle">1x</span>
              </div>
              <div className="folga-hero__metric-count">
                <Receipt size={13} />
                <span>
                  {totalComprasAVista}{' '}
                  {totalComprasAVista === 1 ? 'compra à vista' : 'compras à vista'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quebra por Cartão (Parcelamentos Quitados) */}
        {breakdownPorCartao.length > 0 && (
          <div className="folga-hero__breakdown">
            <span className="folga-hero__breakdown-title">Alívio por fatura:</span>
            <div className="folga-hero__breakdown-chips">
              {breakdownPorCartao.map((bc) => (
                <div key={bc.cartaoId} className="folga-breakdown-chip">
                  <span
                    className="folga-breakdown-chip__dot"
                    style={{ backgroundColor: bc.cor }}
                  />
                  <span className="folga-breakdown-chip__name">{bc.cartaoNome}:</span>
                  <span className="folga-breakdown-chip__value">
                    +{formatCurrency(bc.total)}/mês
                  </span>
                  <span className="folga-breakdown-chip__badge">
                    {bc.count} {bc.count === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo secundário das compras à vista (quando também há parcelamentos) */}
        {hasParcelamentos && hasAVista && (
          <div className="folga-hero__avista-bar">
            <span className="folga-hero__avista-title">
              <Receipt size={13} />
              <span>Sem parcela futura (1x):</span>
            </span>
            <span className="folga-hero__avista-summary">
              {formatCurrency(totalAVista)} em {totalComprasAVista}{' '}
              {totalComprasAVista === 1 ? 'compra à vista' : 'compras à vista'} nesta fatura (não
              entra na economia mensal recorrente)
            </span>
          </div>
        )}
      </div>

      {/* Grid de Cards Modernos */}
      <div className="folga-grid">
        {orderedItems.map((item) => {
          const cardColor = getColor(item.cartaoId, item.cartaoNome)
          const isExpanded = !!expandedItems[item.id]
          const impacto = Number(item.impactoMensal) || 0
          const isAVista = item.tipo === 'A_VISTA_AGRUPADO'
          const qtdCompras = item.quantidadeCompras || item.detalhes?.length || 1
          const detalhes = Array.isArray(item.detalhes) ? item.detalhes : []

          return (
            <article
              key={item.id}
              className={`folga-item-card ${isAVista ? 'folga-item-card--avista' : ''}`}
              style={
                {
                  '--card-brand-color': cardColor
                } as React.CSSProperties
              }
            >
              {/* Barra de cor temática do cartão */}
              <div
                className="folga-item-card__color-accent"
                style={{ backgroundColor: cardColor }}
              />

              <div className="folga-item-card__inner">
                {/* Header do Card */}
                <header className="folga-item-card__header">
                  <div className="folga-item-card__tags">
                    <span
                      className="folga-item-card__cartao-badge"
                      style={{
                        borderColor: `${cardColor}40`,
                        backgroundColor: `${cardColor}15`
                      }}
                    >
                      <span
                        className="folga-item-card__cartao-dot"
                        style={{ backgroundColor: cardColor }}
                      />
                      <CreditCard size={12} className="folga-item-card__cartao-icon" />
                      <span className="folga-item-card__cartao-nome">{item.cartaoNome}</span>
                    </span>

                    {isAVista ? (
                      <span className="folga-item-card__status-badge folga-item-card__status-badge--avista">
                        <Receipt size={12} />
                        <span>
                          {qtdCompras} {qtdCompras === 1 ? 'compra 1x' : 'compras 1x'}
                        </span>
                      </span>
                    ) : (
                      <span className="folga-item-card__status-badge">
                        <CheckCircle2 size={12} />
                        <span>
                          {item.totalParcelas}/{item.totalParcelas} Quitada
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="folga-item-card__dismiss-btn"
                    onClick={() => onDismiss(item.id)}
                    title="Dispensar alerta deste item"
                    aria-label="Dispensar"
                  >
                    <X size={15} />
                  </button>
                </header>

                {/* Conteúdo Principal */}
                <div className="folga-item-card__body">
                  <div className="folga-item-card__title-group">
                    <h3 className="folga-item-card__descricao" title={item.descricao}>
                      {item.descricao}
                    </h3>
                    {isAVista && (
                      <span className="folga-item-card__subnote">
                        Não gera parcela no próximo ciclo
                      </span>
                    )}
                  </div>

                  <div className="folga-item-card__financial">
                    <span className="folga-item-card__financial-label">
                      {isAVista ? 'Pontual na fatura' : 'Valor liberado'}
                    </span>
                    <div
                      className={`folga-item-card__financial-value ${
                        isAVista ? 'folga-item-card__financial-value--avista' : ''
                      }`}
                    >
                      {isAVista ? formatCurrency(impacto) : `+${formatCurrency(impacto)}`}
                      {!isAVista && (
                        <span className="folga-item-card__financial-frequency">/mês</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé Colapsável */}
                <div className="folga-item-card__ai-wrapper">
                  <button
                    type="button"
                    className="folga-item-card__ai-toggle"
                    onClick={() => toggleExpand(item.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="folga-item-card__ai-toggle-left">
                      {isAVista ? (
                        <>
                          <Receipt size={13} className="folga-item-card__avista-icon" />
                          <span>Ver compras incluídas ({qtdCompras})</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb size={13} className="folga-item-card__ai-icon" />
                          <span>Recomendação de Destino</span>
                        </>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div
                      className={`folga-item-card__ai-content ${
                        isAVista ? 'folga-item-card__ai-content--avista' : ''
                      }`}
                    >
                      {isAVista ? (
                        detalhes.length > 0 ? (
                          <ul className="folga-avista-list">
                            {detalhes.map((detalhe, idx) => (
                              <li key={`${item.id}-det-${idx}`} className="folga-avista-list__item">
                                <span
                                  className="folga-avista-list__desc"
                                  title={detalhe.descricao}
                                >
                                  {detalhe.descricao}
                                </span>
                                <span className="folga-avista-list__val">
                                  {formatCurrency(Number(detalhe.valor) || 0)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>{item.mensagem}</p>
                        )
                      ) : (
                        <p>
                          A partir da próxima fatura, você terá este valor mensal de{' '}
                          <strong>{formatCurrency(impacto)}</strong> disponível no seu orçamento.
                          Considere direcionar essa quantia para reserva de emergência ou
                          investimentos!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
