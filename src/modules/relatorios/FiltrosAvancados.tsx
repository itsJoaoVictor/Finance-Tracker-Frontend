interface FiltrosAvancadosProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (val: string) => void
  onDataFimChange: (val: string) => void
}

export function FiltrosAvancados({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
}: FiltrosAvancadosProps) {
  const periodosPredefinidos = [
    {
      label: 'Mês Atual',
      get: () => {
        const hoje = new Date()
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        return {
          inicio: inicio.toISOString().split('T')[0],
          fim: hoje.toISOString().split('T')[0],
        }
      },
    },
    {
      label: 'Mês Anterior',
      get: () => {
        const hoje = new Date()
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        return {
          inicio: inicio.toISOString().split('T')[0],
          fim: fim.toISOString().split('T')[0],
        }
      },
    },
    {
      label: 'Últimos 3 Meses',
      get: () => {
        const hoje = new Date()
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
        return {
          inicio: inicio.toISOString().split('T')[0],
          fim: hoje.toISOString().split('T')[0],
        }
      },
    },
  ]

  const aplicarPeriodo = (periodo: { inicio: string; fim: string }) => {
    onDataInicioChange(periodo.inicio)
    onDataFimChange(periodo.fim)
  }

  return (
    <div className="filtros-avancados">
      <div className="filtros-avancados__presets">
        {periodosPredefinidos.map((p) => (
          <button
            key={p.label}
            className="filtros-avancados__preset-btn"
            onClick={() => aplicarPeriodo(p.get())}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="filtros-avancados__custom">
        <div className="filtros-avancados__field">
          <label htmlFor="dataInicio">Data Início</label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => onDataInicioChange(e.target.value)}
          />
        </div>
        <div className="filtros-avancados__field">
          <label htmlFor="dataFim">Data Fim</label>
          <input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => onDataFimChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
