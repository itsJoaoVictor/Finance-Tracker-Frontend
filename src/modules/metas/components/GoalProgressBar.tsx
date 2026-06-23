interface GoalProgressBarProps {
  nomeMeta: string
  valorAlvo: number
  valorAcumulado: number
  corHexadecimal: string
  onDelete?: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function GoalProgressBar({
  nomeMeta,
  valorAlvo,
  valorAcumulado,
  corHexadecimal,
  onDelete,
}: GoalProgressBarProps) {
  const percentual = valorAlvo > 0 ? Math.min((valorAcumulado / valorAlvo) * 100, 100) : 0

  return (
    <div className="meta-card">
      <div className="meta-card__header">
        <h3 className="meta-card__title">{nomeMeta}</h3>
        {onDelete && (
          <button
            type="button"
            className="meta-card__delete"
            onClick={onDelete}
            title="Excluir Cofrinho"
          >
            🗑
          </button>
        )}
      </div>

      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentual}%`, backgroundColor: corHexadecimal }}
        />
      </div>

      <div className="meta-card__values">
        <p className="meta-card__amount">
          <strong>{formatCurrency(valorAcumulado)}</strong> / {formatCurrency(valorAlvo)}
        </p>
        <p className="meta-card__percentage">{percentual.toFixed(1)}%</p>
      </div>
    </div>
  )
}