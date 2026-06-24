import { CategoriaRelatorio } from '../../types/relatorio'

interface GraficoDistribuicaoCategoriaProps {
  categorias: CategoriaRelatorio[]
  totalConsolidado: number
}

export function GraficoDistribuicaoCategoria({
  categorias,
  totalConsolidado,
}: GraficoDistribuicaoCategoriaProps) {
  const formatar = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  if (categorias.length === 0) {
    return (
      <div className="widget grafico-distribuicao">
        <h3>Distribuição por Categoria</h3>
        <p className="grafico-distribuicao__empty">
          Nenhum dado disponível para o período selecionado
        </p>
      </div>
    )
  }

  // Gerar fatias SVG
  let anguloAtual = 0
  const fatias = []
  const cx = 80, cy = 80, r = 70

  for (const cat of categorias) {
    const percentual = cat.percentual / 100
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
        key={cat.categoriaId}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={cat.corHexadecimal}
        stroke="#fff"
        strokeWidth={2}
      >
        <title>{`${cat.categoriaNome}: ${formatar(cat.valorTotal)} (${cat.percentual.toFixed(1)}%)`}</title>
      </path>
    )

    anguloAtual += anguloFatia
  }

  return (
    <div className="widget grafico-distribuicao">
      <h3>Distribuição por Categoria</h3>
      <div className="grafico-distribuicao__total">
        Total: <strong>{formatar(totalConsolidado)}</strong>
      </div>
      <div className="grafico-distribuicao__container">
        <svg width={160} height={160} viewBox="0 0 160 160">
          {fatias}
          <circle cx={cx} cy={cy} r={35} fill="var(--bg-color, #fff)" />
        </svg>
        <div className="grafico-distribuicao__legend">
          {categorias.map((cat) => (
            <div key={cat.categoriaId} className="grafico-distribuicao__legend-item">
              <span
                className="grafico-distribuicao__legend-color"
                style={{ backgroundColor: cat.corHexadecimal }}
              />
              <span className="grafico-distribuicao__legend-label">{cat.categoriaNome}</span>
              <span className="grafico-distribuicao__legend-valor">
                {formatar(cat.valorTotal)}
              </span>
              <span className="grafico-distribuicao__legend-percent">
                {cat.percentual.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
