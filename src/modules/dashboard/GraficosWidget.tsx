import { useMemo } from 'react'
import { DashboardResumo } from '../../types/dashboard'

interface GraficosWidgetProps {
  transacoes: DashboardResumo['ultimasTransacoes']
}

export function GraficosWidget({ transacoes }: GraficosWidgetProps) {
  // Dados para gráfico de pizza (despesas por categoria)
  const gastosPorCategoria = useMemo(() => {
    const mapa = new Map<string, { valor: number; cor: string; nome: string }>()
    transacoes
      .filter((t) => t.tipo === 'SAQUE' || t.tipo === 'PIX' || t.tipo === 'COMPRA_CREDITO')
      .forEach((t) => {
        const chave = t.categoriaNome || 'Outros'
        const existente = mapa.get(chave) || { valor: 0, cor: t.categoriaCorHexadecimal || '#888', nome: chave }
        existente.valor += Math.abs(t.valor)
        mapa.set(chave, existente)
      })
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor)
  }, [transacoes])

  const total = gastosPorCategoria.reduce((acc, c) => acc + c.valor, 0)

  // Gerar fatias do SVG de pizza
  const gerarFatias = () => {
    if (total === 0) return null
    let anguloAtual = 0
    const fatias = []
    const cx = 60, cy = 60, r = 50

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
          stroke="#fff"
          strokeWidth={1}
        >
          <title>{`${cat.nome}: R$ ${cat.valor.toFixed(2)} (${(percentual * 100).toFixed(1)}%)`}</title>
        </path>
      )

      anguloAtual += anguloFatia
    }
    return fatias
  }

  const fatias = useMemo(() => gerarFatias(), [gastosPorCategoria, total])

  return (
    <div className="widget graficos-widget">
      <h3 className="widget__header">Gráficos</h3>

      <div className="graficos-widget__grid">
        {/* Gráfico de Rosca */}
        <div className="graficos-widget__card">
          <h4>Despesas por Categoria</h4>
          {total === 0 ? (
            <p className="graficos-widget__empty">Nenhuma despesa no período</p>
          ) : (
            <div className="graficos-widget__chart-container">
              <svg width={120} height={120} viewBox="0 0 120 120">
                {fatias}
                {/* Círculo interno para efeito de rosca */}
                <circle cx={60} cy={60} r={25} fill="var(--bg-color, #fff)" />
              </svg>
              <div className="graficos-widget__legend">
                {gastosPorCategoria.slice(0, 5).map((cat) => (
                  <div key={cat.nome} className="graficos-widget__legend-item">
                    <span
                      className="graficos-widget__legend-color"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <span className="graficos-widget__legend-label">{cat.nome}</span>
                    <span className="graficos-widget__legend-value">
                      {total > 0 ? ((cat.valor / total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de barras simples (últimas transações por tipo) */}
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
                  .filter((t) => t.tipo === 'SAQUE' || t.tipo === 'PIX' || t.tipo === 'COMPRA_CREDITO')
                  .reduce((acc, t) => acc + Math.abs(t.valor), 0)
                const max = Math.max(receitas, despesas, 1)

                return (
                  <>
                    <div className="graficos-widget__barra-item">
                      <span className="graficos-widget__barra-label">Receitas</span>
                      <div className="graficos-widget__barra-track">
                        <div
                          className="graficos-widget__barra-fill graficos-widget__barra-fill--receita"
                          style={{ width: `${(receitas / max) * 100}%` }}
                        />
                      </div>
                      <span className="graficos-widget__barra-valor">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(receitas)}
                      </span>
                    </div>
                    <div className="graficos-widget__barra-item">
                      <span className="graficos-widget__barra-label">Despesas</span>
                      <div className="graficos-widget__barra-track">
                        <div
                          className="graficos-widget__barra-fill graficos-widget__barra-fill--despesa"
                          style={{ width: `${(despesas / max) * 100}%` }}
                        />
                      </div>
                      <span className="graficos-widget__barra-valor">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(despesas)}
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