import { useState, useRef, useEffect } from 'react'
import { Assinatura } from '../../../types'
import { FinanceCard } from '../../../components/FinanceCard'

interface SubscriptionCardProps {
  assinatura: Assinatura
  categoriaNome: string
  cartaoNome: string
  periodicidadeLabel: string
  onEdit: (assinatura: Assinatura) => void
  onPauseResume: (assinatura: Assinatura) => void
  onDelete: (assinatura: Assinatura) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function SubscriptionCard({
  assinatura,
  categoriaNome,
  cartaoNome,
  periodicidadeLabel,
  onEdit,
  onPauseResume,
  onDelete,
}: SubscriptionCardProps) {
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

  const badgeText = assinatura.ativo ? 'Ativa' : 'Pausada'

  return (
    <div style={{ position: 'relative' }}>
      <FinanceCard
        titulo={assinatura.nome}
        subtitulo={`${categoriaNome} \u2022 ${periodicidadeLabel}`}
        valorPrincipal={formatCurrency(assinatura.valor)}
        icone={'\u{1F504}'}
        badgeText={badgeText}
        onClickOptions={() => setMenuOpen((o) => !o)}
      >
        <p className="assinatura-card__proxima">
          Pr&oacute;xima cobran&ccedil;a: {formatDate(assinatura.dataProximaCobranca)}
        </p>
        <p className="assinatura-card__cartao">
          Cart&atilde;o: {cartaoNome}
        </p>
      </FinanceCard>

      {menuOpen && (
        <div
          className="account-card__dropdown"
          ref={menuRef}
          style={{ position: 'absolute', right: 12, top: 54, zIndex: 50 }}
        >
          <button
            className="account-card__dropdown-item"
            onClick={() => { setMenuOpen(false); onEdit(assinatura) }}
          >
            ✏️ Editar
          </button>
          <button
            className="account-card__dropdown-item"
            onClick={() => { setMenuOpen(false); onPauseResume(assinatura) }}
          >
            {assinatura.ativo ? '\u23F8 Pausar' : '\u25B6 Reativar'}
          </button>
          <button
            className="account-card__dropdown-item account-card__dropdown-item--danger"
            onClick={() => { setMenuOpen(false); onDelete(assinatura) }}
          >
            🗑️ Excluir
          </button>
        </div>
      )}
    </div>
  )
}
