import { Conta } from '../../../types'
import { AccountCard } from './AccountCard'

interface AccountListProps {
  contas: Conta[]
  loading: boolean
  onEdit: (conta: Conta) => void
  onDelete: (conta: Conta) => void
  onNovaTransacao: (conta: Conta) => void
}

export function AccountList({ contas, loading, onEdit, onDelete, onNovaTransacao }: AccountListProps) {
  if (loading) {
    return (
      <div className="account-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="account-card account-card--skeleton" />
        ))}
      </div>
    )
  }

  if (contas.length === 0) {
    return (
      <div className="account-list">
        <div className="account-list--empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M2 10h20" />
          </svg>
          <p>Nenhuma conta cadastrada ainda.</p>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
            Clique em <strong>+ Nova Conta</strong> para começar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="account-list">
      {contas.map((conta) => (
        <AccountCard
          key={conta.id}
          conta={conta}
          onEdit={onEdit}
          onDelete={onDelete}
          onNovaTransacao={onNovaTransacao}
        />
      ))}
    </div>
  )
}
