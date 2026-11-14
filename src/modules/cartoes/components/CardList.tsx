import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { Cartao, Conta, ProjecaoCartao } from '../../../types'
import { IaInsight } from '../../../services/iaService'
import { CreditCard } from './CreditCard'

interface CardListProps {
  cartoes: Cartao[]
  contas: Conta[]
  loading: boolean
  insights: IaInsight[]
  projecoes: ProjecaoCartao[]
  onEdit: (cartao: Cartao) => void
  onDelete: (cartao: Cartao) => void
  onViewFaturas: (cartao: Cartao) => void
  onNovaTransacao: (cartao: Cartao) => void
  onPagarFatura: (cartao: Cartao) => void
  onRefreshInsights: () => void
  onCreateNew?: () => void
}

export function CardList({
  cartoes,
  contas,
  loading,
  insights,
  projecoes,
  onEdit,
  onDelete,
  onViewFaturas,
  onNovaTransacao,
  onPagarFatura,
  onRefreshInsights,
  onCreateNew
}: CardListProps) {
  if (loading) {
    return (
      <div className="cartoes-cards-grid">
        {[1, 2].map((i) => (
          <div key={i} className="account-card account-card--skeleton" style={{ height: 370, borderRadius: 20 }} />
        ))}
      </div>
    )
  }

  if (cartoes.length === 0) {
    return (
      <div className="cartoes-empty-state">
        <div className="cartoes-empty-state__icon">
          <CreditCardIcon size={32} />
        </div>
        <h3 className="cartoes-empty-state__title">Nenhum cartão de crédito cadastrado</h3>
        <p className="cartoes-empty-state__desc">
          Cadastre seus cartões para acompanhar faturas, projeções de fechamento por IA e folga de limite mensal.
        </p>
        {onCreateNew && (
          <button type="button" className="btn-nova-conta" onClick={onCreateNew}>
            <Plus size={16} /> Cadastrar Primeiro Cartão
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="cartoes-cards-grid">
      {cartoes.map((cartao) => (
        <CreditCard
          key={cartao.id}
          cartao={cartao}
          contas={contas}
          insights={insights}
          projecoes={projecoes}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewFaturas={onViewFaturas}
          onNovaTransacao={onNovaTransacao}
          onPagarFatura={onPagarFatura}
          onRefreshInsights={onRefreshInsights}
        />
      ))}
    </div>
  )
}
