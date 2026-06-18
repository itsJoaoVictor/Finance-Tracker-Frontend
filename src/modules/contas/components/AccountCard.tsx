import { useState, useRef, useEffect } from 'react'
import { Conta } from '../../../types'

interface AccountCardProps {
  conta: Conta
  onEdit: (conta: Conta) => void
  onDelete: (conta: Conta) => void
}

const TIPO_ICON: Record<string, string> = {
  CORRENTE: '🏦',
  POUPANCA: '🐷',
}

const TIPO_LABEL: Record<string, string> = {
  CORRENTE: 'Conta Corrente',
  POUPANCA: 'Poupança',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function AccountCard({ conta, onEdit, onDelete }: AccountCardProps) {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const colorBar = conta.corHexadecimal || '#ccc'

  return (
    <div className="account-card">
      <div className="account-card__color-bar" style={{ background: colorBar }} />
      <div className="account-card__body">
        <div className="account-card__top">
          <div className="account-card__info">
            <div
              className={`account-card__icon account-card__icon--${conta.tipo.toLowerCase()}`}
              style={{ background: conta.corHexadecimal ? `${conta.corHexadecimal}20` : undefined }}
            >
              {TIPO_ICON[conta.tipo]}
            </div>
            <div>
              <p className="account-card__name">{conta.nome}</p>
              <p className="account-card__type">{TIPO_LABEL[conta.tipo]}</p>
            </div>
          </div>

          {/* Menu ··· */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className="account-card__menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Opções da conta"
            >
              ···
            </button>
            {menuOpen && (
              <div className="account-card__dropdown">
                <button
                  className="account-card__dropdown-item"
                  onClick={() => { setMenuOpen(false); onEdit(conta) }}
                >
                  ✏️ Editar
                </button>
                <button
                  className="account-card__dropdown-item account-card__dropdown-item--danger"
                  onClick={() => { setMenuOpen(false); onDelete(conta) }}
                >
                  🗑️ Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saldo */}
        <div className="account-card__balance-section">
          <span
            className={`account-card__balance ${!balanceVisible ? 'account-card__balance--hidden' : ''}`}
          >
            {balanceVisible ? formatCurrency(conta.saldo) : '•••••••'}
          </span>
          <button
            className="account-card__toggle-btn"
            onClick={() => setBalanceVisible((v) => !v)}
            aria-label={balanceVisible ? 'Ocultar saldo' : 'Exibir saldo'}
          >
            {balanceVisible ? '👁' : '🙈'}
          </button>
        </div>

        {/* Badges */}
        {conta.contaPadrao && (
          <div className="account-card__badges">
            <span className="badge badge--padrao">⭐ Conta Padrão</span>
          </div>
        )}
      </div>
    </div>
  )
}
