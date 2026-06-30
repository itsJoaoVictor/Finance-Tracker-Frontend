import { FolgaLimiteItem } from '../../../services/iaService'
import './FolgaLimiteSection.css'

interface FolgaLimiteSectionProps {
  items: FolgaLimiteItem[]
  onDismiss: (id: string) => void
}

export function FolgaLimiteSection({ items, onDismiss }: FolgaLimiteSectionProps) {
  if (items.length === 0) return null

  const handleDismiss = (id: string) => {
    // Only dismiss locally in UI, next refresh brings it back if fatura is still open
    onDismiss(id)
  }

  const totalFolgado = items.reduce((acc, item) => acc + item.impactoMensal, 0)
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="folga-section">
      <div className="folga-section__header">
        <span className="folga-section__icon">🎉</span>
        <h3 className="folga-section__title">Folga de Limite</h3>
        <span className="folga-section__total" title="Este é o valor que você deixará de pagar no próximo mês">
          Fatura R$ {formatCurrency(totalFolgado).replace('R$', '').trim()} mais barata
        </span>
      </div>
      <p className="folga-section__subtitle">
        Estes parcelamentos terminam agora. A partir do mês que vem, esse dinheiro sobra no seu bolso!
      </p>

      <div className="folga-section__list">
        {items.map((item) => (
          <div key={item.id} className="folga-card">
            <div className="folga-card__header">
              <span className="folga-card__title">{item.titulo}</span>
              <button
                className="folga-card__dismiss"
                onClick={() => handleDismiss(item.id)}
                title="Dispensar"
              >
                ✕
              </button>
            </div>
            <p className="folga-card__message">{item.mensagem}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
