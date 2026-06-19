import { Cartao, Conta } from '../../../types'
import { CreditCard } from './CreditCard'

interface CardListProps {
  cartoes: Cartao[]
  contas: Conta[]
  loading: boolean
  onEdit: (cartao: Cartao) => void
  onDelete: (cartao: Cartao) => void
}

export function CardList({ cartoes, contas, loading, onEdit, onDelete }: CardListProps) {
  if (loading) {
    return (
      <div className="account-list">
        {[1, 2].map((i) => (
          <div key={i} className="account-card account-card--skeleton" style={{ height: 210 }} />
        ))}
      </div>
    )
  }

  if (cartoes.length === 0) {
    return (
      <div className="account-list">
        <div className="account-list--empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <p>Nenhum cartão de crédito cadastrado ainda.</p>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
            Clique em <strong>+ Novo Cartão</strong> para começar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="account-list">
      {cartoes.map((cartao) => (
        <CreditCard
          key={cartao.id}
          cartao={cartao}
          contas={contas}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
