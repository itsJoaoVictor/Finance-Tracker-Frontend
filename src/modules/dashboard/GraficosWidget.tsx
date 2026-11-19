import { useMemo } from 'react'
import { PieChart } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface GraficosWidgetProps {
  transacoes: DashboardResumo['ultimasTransacoes']
  ocultarValores?: boolean
}

const CHART_PALETTE = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
]

export function GraficosWidget({ transacoes, ocultarValores = false }: GraficosWidgetProps) {
  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor)
  }

  const formatarCurto = (valor: number) => {
    if (ocultarValores) return '••••'
    if (valor >= 1000) {
      return `R$ ${(valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(valor)
  }

  // Dados para gráfico de rosca (despesas por categoria) com cores distintas garantidas
  const gastosPorCategoria = useMemo(() => {
    const mapa = new Map<string, { valor: number; cor: string; nome: string }>()
    transacoes
      .filter(
        (t) =>
          t.tipo === 'SAQUE' ||
          t.tipo === 'PIX' ||
          t.tipo === 'COMPRA_CREDITO' ||
          t.tipo === 'PAGAMENTO_BOLETO'
      )
      .forEach((t) => {
        const chave = t.categoriaNome || 'Outros'
        const existente = mapa.get(chave) || {
          valor: 0,
          cor: t.categoriaCorHexadecimal || '',
          nome: chave,
        }
        existente.valor += Math.abs(t.valor)
        mapa.set(chave, existente)
      })

    const sorted = Array.from(mapa.values()).sort((a, b) => b.valor - a.valor)
    const usedColors = new Set<string>()

    return sorted.map((item, idx) => {
      let assignedColor = item.cor ? item.cor.toLowerCase() : ''
      if (!assignedColor || usedColors.has(assignedColor)) {
        assignedColor = CHART_PALETTE[idx % CHART_PALETTE.length]
      }
      usedColors.add(assignedColor)
      return { ...item, cor: assignedColor }
    })
  }, [transacoes])

  const total = gastosPorCategoria.reduce((acc, c) => acc + c.valor, 0)

  const gerarFatias = () => {
    if (total === 0) return null
    let anguloAtual = -90 // começa no topo
    const fatias = []
    const cx = 64,
      cy = 64,
      r = 52

    if (gastosPorCategoria.length === 1) {
      const cat = gastosPorCategoria[0]
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={cat.cor}
        >
          <title>{`${cat.nome}: ${formatar(cat.valor)} (100%)`}</title>
        </circle>
      )
    }

    for (const cat of gastosPorCategoria) {
      const percentual = cat.valor / total
      const anguloFatia = percentual * 360
      const anguloRad = (anguloAtual * Math.PI) / 180
      const anguloFimRad = ((anguloAtual + anguloFatia) * Math.PI) / 180

      const x1 = cx + r * Math.cos(anguloRad)
      const y1 = cy + r * Math.sin(anguloRad)
      const x2 = cx + r * Math.cos(anguloFimRad)
      const y2 = cy + r * Math.sin(anguloFimRad)

      const largeArc = anguloFatia > 180 ? 1 : 0

      fatias.push(
        <path
          key={cat.nome}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={cat.cor}
          stroke="var(--surface-subtle, var(--card))"
          strokeWidth={1.8}
        >
          <title>{`${cat.nome}: ${formatar(cat.valor)} (${(percentual * 100).toFixed(1)}%)`}</title>
        </path>
      )

      anguloAtual += anguloFatia
    }
    return fatias
  }

  const fatias = useMemo(() => gerarFatias(), [gastosPorCategoria, total, ocultarValores])

  return (
    <div className="widget graficos-widget">
      <div className="widget__header-row">
        <div className="widget__header-title">
          <PieChart size={18} className="widget__header-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>Análise do Período</h3>
        </div>
      </div>

      <div className="graficos-widget__grid">
        {/* Gráfico de Rosca */}
        <div className="graficos-widget__card">
          <div className="graficos-widget__card-header">
            <h4>Despesas por Categoria</h4>
            {total > 0 && (
              <span className="graficos-widget__card-total">{formatar(total)}</span>
            )}
          </div>

          {total === 0 ? (
            <p className="graficos-widget__empty">Nenhuma despesa no período</p>
          ) : (
            <div className="graficos-widget__chart-container">
              <div className="graficos-widget__donut-wrap">
                <svg width={128} height={128} viewBox="0 0 128 128">
                  {fatias}
                  {/* Círculo interno adaptado ao tema */}
                  <circle cx={64} cy={64} r={33} fill="var(--surface-subtle, var(--card))" />
                </svg>
                <div className="graficos-widget__donut-center">
                  <span className="graficos-widget__donut-label">Total</span>
                  <span className="graficos-widget__donut-value">{formatarCurto(total)}</span>
                </div>
              </div>

              <div className="graficos-widget__legend">
                {gastosPorCategoria.slice(0, 5).map((cat) => {
                  const pct = total > 0 ? ((cat.valor / total) * 100).toFixed(1) : '0.0'
                  return (
                    <div key={cat.nome} className="graficos-widget__legend-item">
                      <span
                        className="graficos-widget__legend-color"
                        style={{ backgroundColor: cat.cor }}
                      />
                      <span className="graficos-widget__legend-label">{cat.nome}</span>
                      <span className="graficos-widget__legend-amount">{formatar(cat.valor)}</span>
                      <span className="graficos-widget__legend-value">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Balanço Receitas vs Despesas */}
        <div className="graficos-widget__card">
          <h4>Receitas vs Despesas</h4>
          {transacoes.length === 0 ? (
            <p className="graficos-widget__empty">Nenhuma transação no período</p>
          ) : (
            <div className="graficos-widget__barras">
              {(() => {
                const receitas = transacoes
                  .filter((t) => t.tipo === 'DEPOSITO')
                  .reduce((acc, t) => acc + Math.abs(t.valor), 0)
                const despesas = transacoes
                  .filter(
                    (t) =>
                      t.tipo === 'SAQUE' ||
                      t.tipo === 'PIX' ||
                      t.tipo === 'COMPRA_CREDITO' ||
                      t.tipo === 'PAGAMENTO_BOLETO'
                  )
                  .reduce((acc, t) => acc + Math.abs(t.valor), 0)
                const max = Math.max(receitas, despesas, 1)
                const resultado = receitas - despesas

                return (
                  <>
                    <div className="graficos-widget__barra-item">
                      <div className="graficos-widget__barra-head">
                        <span className="graficos-widget__barra-label">Receitas</span>
                        <span className="graficos-widget__barra-valor graficos-widget__barra-valor--receita">
                          {formatar(receitas)}
                        </span>
                      </div>
                      <div className="graficos-widget__barra-track">
                        <div
                          className="graficos-widget__barra-fill graficos-widget__barra-fill--receita"
                          style={{ width: `${Math.max(receitas > 0 ? 4 : 0, (receitas / max) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="graficos-widget__barra-item">
                      <div className="graficos-widget__barra-head">
                        <span className="graficos-widget__barra-label">Despesas</span>
                        <span className="graficos-widget__barra-valor graficos-widget__barra-valor--despesa">
                          {formatar(despesas)}
                        </span>
                      </div>
                      <div className="graficos-widget__barra-track">
                        <div
                          className="graficos-widget__barra-fill graficos-widget__barra-fill--despesa"
                          style={{ width: `${Math.max(despesas > 0 ? 4 : 0, (despesas / max) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="graficos-widget__net-result">
                      <span className="graficos-widget__net-label">Resultado do Período</span>
                      <span
                        className={`graficos-widget__net-value ${
                          resultado >= 0
                            ? 'graficos-widget__net-value--positivo'
                            : 'graficos-widget__net-value--negativo'
                        }`}
                      >
                        {resultado > 0 && !ocultarValores ? '+' : ''}
                        {formatar(resultado)}
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
