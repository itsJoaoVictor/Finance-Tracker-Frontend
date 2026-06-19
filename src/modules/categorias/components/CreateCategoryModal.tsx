import { useState, FormEvent } from 'react'
import { CategoriaRequest } from '../../../types'
import { FormModal } from '../../../components/FormModal'
import { CategoryIcon } from '../../../components/CategoryIcon'

interface CreateCategoryModalProps {
  onClose: () => void
  onSubmit: (data: CategoriaRequest) => Promise<void>
}

const COMMON_ICONS = [
  'ShoppingBasket',
  'Car',
  'Home',
  'HeartPulse',
  'GraduationCap',
  'Smile',
  'HelpCircle',
  'Utensils',
  'Coffee',
  'Gift',
  'Plane',
  'Film',
  'Briefcase',
  'CreditCard',
  'Activity',
  'DollarSign',
  'BookOpen',
  'Gamepad2',
  'Music',
  'Smartphone',
  'Camera',
  'Scissors',
  'Sparkles',
  'PawPrint',
  'Shirt',
  'Dumbbell',
  'Wrench',
  'Tv',
  'Bike',
  'Shield',
  'PiggyBank',
  'TrendingUp',
  'Wallet',
  'Percent',
  'Receipt',
  'Coins',
  'Bus',
  'Train',
  'Fuel',
  'Pizza',
  'Wine',
  'Beer',
  'Heart',
  'Baby',
  'Trophy',
  'Key',
  'Umbrella',
  'ShoppingBag'
]

export function CreateCategoryModal({ onClose, onSubmit }: CreateCategoryModalProps) {
  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('HelpCircle')
  const [cor, setCor] = useState('#7F8C8D')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) {
      e.nome = 'Nome da categoria é obrigatório'
    }
    if (!icone) {
      e.icone = 'Selecione um ícone para a categoria'
    }
    if (!cor) {
      e.cor = 'Selecione uma cor para a categoria'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        nome: nome.trim(),
        icone,
        corHexadecimal: cor,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      titulo="Nova Categoria"
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={loading}
    >
      <div className="form-group">
        <label htmlFor="criar-categoria-nome">Nome da Categoria</label>
        <input
          id="criar-categoria-nome"
          type="text"
          placeholder="Ex: Supermercado Mensal"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={errors.nome ? 'error' : ''}
          maxLength={100}
        />
        {errors.nome && <p className="form-error">{errors.nome}</p>}
      </div>

      <div className="form-group">
        <label>Selecione um Ícone</label>
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(8, 1fr)', 
            gap: 10, 
            marginTop: 8,
            padding: 12,
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: '12px',
            background: 'var(--bg-hover, #fdfdfd)'
          }}
        >
          {COMMON_ICONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setIcone(iconName)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '8px',
                border: icone === iconName ? '2px solid var(--accent, #f05a3c)' : '2px solid transparent',
                background: icone === iconName ? 'rgba(240, 90, 60, 0.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <CategoryIcon name={iconName} color={icone === iconName ? 'var(--accent, #f05a3c)' : '#7f8c8d'} size={20} />
            </button>
          ))}
        </div>
        {errors.icone && <p className="form-error">{errors.icone}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="criar-categoria-cor">Cor da Categoria</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div className="color-preview" style={{ background: cor }} />
          <input
            id="criar-categoria-cor"
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
            {cor.toUpperCase()}
          </span>
        </div>
        {errors.cor && <p className="form-error">{errors.cor}</p>}
      </div>
    </FormModal>
  )
}
