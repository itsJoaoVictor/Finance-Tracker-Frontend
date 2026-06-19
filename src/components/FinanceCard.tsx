import React from 'react'

interface FinanceCardProps {
  titulo: string
  subtitulo: string
  valorPrincipal: string
  corHexadecimal?: string
  icone: string | React.ReactNode
  badgeText?: string
  onClickOptions?: (e: React.MouseEvent) => void
  children?: React.ReactNode
}

export function FinanceCard({
  titulo,
  subtitulo,
  valorPrincipal,
  corHexadecimal = '#ccc',
  icone,
  badgeText,
  onClickOptions,
  children,
}: FinanceCardProps) {
  return (
    <div className="account-card">
      <div className="account-card__color-bar" style={{ background: corHexadecimal }} />
      <div className="account-card__body">
        <div className="account-card__top">
          <div className="account-card__info">
            <div
              className="account-card__icon"
              style={{ background: `${corHexadecimal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {icone}
            </div>
            <div>
              <p className="account-card__name">{titulo}</p>
              <p className="account-card__type">{subtitulo}</p>
            </div>
          </div>

          {onClickOptions && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="account-card__menu-btn"
                onClick={onClickOptions}
                aria-label="Opções"
              >
                ···
              </button>
            </div>
          )}
        </div>

        <div className="account-card__balance-section">
          <span className="account-card__balance">
            {valorPrincipal}
          </span>
        </div>

        {badgeText && (
          <div className="account-card__badges" style={{ marginTop: 8 }}>
            <span className="badge badge--padrao">{badgeText}</span>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
