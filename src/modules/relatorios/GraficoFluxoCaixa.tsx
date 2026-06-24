import { RelatorioFluxoCaixa } from '../../types/relatorio'

interface GraficoFluxoCaixaProps {
  dados: RelatorioFluxoCaixa[]
}

export function GraficoFluxoCaixa({ dados }: GraficoFluxoCaixaProps) {
  const formatar = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  if (dados.length === 0) {
    return (
      <div className="widget grafico-fluxo-caixa">
        <h3>Fluxo de Caixa Mensal</h3>
        <p className="grafico-fluxo-caixa__empty">
          Nenhum dado disponível para o período
        </p>
      </div>
    )
  }

  // Calcular máximos para escala do gráfico
  const maxValor = Math.max(
    ...dados.map((d) => Math.max(d.totalReceitas, d.totalDespesas, Math.abs(d.saldoLiquido))),
    1
  )

  const altura = 200
  const larguraItem = 60
  const larguraTotal = dados.length * larguraItem

  return (
    <div className="widget grafico-fluxo-caixa">
      <h3>Fluxo de Caixa Mensal</h3>
      <div className="grafico-fluxo-caixa__chart" style={{ height: altura + 40 }}>
        <svg width={larguraTotal} height={altura + 20} viewBox={`0 0 ${larguraTotal} ${altura + 20}`}>
          {/* Linhas de grade */}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = altura - altura * frac
            return (
              <line
                key={frac}
                x1={0}
                y1={y}
                x2={larguraTotal}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth={0.5}
              />
            )
          })}

          {/* Barras e linha de saldo */}
          {dados.map((d, i) => {
            const x = i * larguraItem + 5
            const barWidth = (larguraItem - 10) / 3

            const altReceita = (d.totalReceitas / maxValor) * (altura - 20)
            const altDespesa = (d.totalDespesas / maxValor) * (altura - 20)

            return (
              <g key={d.mesReferencia}>
                {/* Barra de Receitas */}
                <rect
                  x={x}
                  y={altura - 10 - altReceita}
                  width={barWidth}
                  height={altReceita}
                  fill="#34C759"
                  rx={2}
                >
                  <title>Receitas: {formatar(d.totalReceitas)}</title>
                </rect>
                {/* Barra de Despesas */}
                <rect
                  x={x + barWidth + 2}
                  y={altura - 10 - altDespesa}
                  width={barWidth}
                  height={altDespesa}
                  fill="#FF3B30"
                  rx={2}
                >
                  <title>Despesas: {formatar(d.totalDespesas)}</title>
                </rect>
                {/* Linha do Saldo Líquido */}
                {i > 0 && (
                  <line
                    x1={(i - 1) * larguraItem + 5 + barWidth + 1}
                    y1={altura - 10 - ((dados[i - 1].saldoLiquido / maxValor) * (altura - 20))}
                    x2={x + barWidth + 1}
                    y2={altura - 10 - ((d.saldoLiquido / maxValor) * (altura - 20))}
                    stroke="#007AFF"
                    strokeWidth={2}
                    strokeDasharray="4"
                  />
                )}
                {/* Ponto de saldo */}
                <circle
                  cx={x + barWidth + 1}
                  cy={altura - 10 - ((d.saldoLiquido / maxValor) * (altura - 20))}
                  r={3}
                  fill="#007AFF"
                >
                  <title>Saldo: {formatar(d.saldoLiquido)}</title>
                </circle>
                {/* Label do mês */}
                <text
                  x={x + barWidth + 1}
                  y={altura + 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#888"
                >
                  {d.mesReferencia.substring(5)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="grafico-fluxo-caixa__legend">
        <span className="grafico-fluxo-caixa__legend-item">
          <span className="grafico-fluxo-caixa__legend-color grafico-fluxo-caixa__legend-color--receita" />
          Receitas
        </span>
        <span className="grafico-fluxo-caixa__legend-item">
          <span className="grafico-fluxo-caixa__legend-color grafico-fluxo-caixa__legend-color--despesa" />
          Despesas
        </span>
        <span className="grafico-fluxo-caixa__legend-item">
          <span className="grafico-fluxo-caixa__legend-color grafico-fluxo-caixa__legend-color--saldo" />
          Saldo Líquido
        </span>
      </div>
    </div>
  )
}
