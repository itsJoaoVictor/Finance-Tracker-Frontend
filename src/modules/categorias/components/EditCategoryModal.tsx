import { useState, FormEvent } from 'react'
import { Category, CategoryUpdateRequest } from '../../../types'
import { ColorPicker } from '../../../components/ColorPicker'
import { CategoryIcon } from '../../../components/CategoryIcon'

interface EditCategoryModalProps {
  categoria: Category
  onClose: () => void
  onSubmit: (id: string, data: CategoryUpdateRequest) => Promise<void>
}

// ── Ícones disponíveis (Lucide React) ──
const COMMON_ICONS = [
  // Comida & Bebida
  'coffee', 'utensils', 'utensils-crossed', 'apple', 'beef', 'cake', 'cake-slice',
  'candy', 'cherry', 'cookie', 'cup-soda', 'drumstick', 'egg', 'grape', 'ice-cream',
  'ice-cream-bowl', 'lollipop', 'milk', 'pizza', 'popcorn', 'popsicle', 'salad',
  'sandwich', 'soup', 'wheat', 'wine',

  // Finanças & Compras
  'shopping-basket', 'shopping-cart', 'shopping-bag', 'credit-card', 'dollar-sign',
  'trending-up', 'trending-down', 'banknote', 'chart-bar', 'chart-pie', 'chart-column',
  'coins', 'currency', 'euro', 'landmark', 'piggy-bank', 'receipt', 'wallet',
  'circle-dollar-sign', 'crown', 'gem', 'gift', 'tag', 'ticket',

  // Transporte
  'car', 'plane', 'bus', 'bike', 'train', 'train-front', 'tram-front', 'ship',
  'truck', 'fuel', 'sailboat', 'rocket', 'tractor', 'caravan',

  // Casa & Construção
  'home', 'building', 'building-2', 'city', 'door', 'key', 'lamp', 'lightbulb',
  'chair', 'sofa', 'shower-head', 'washing-machine', 'microwave', 'fence',
  'factory', 'warehouse', 'tool', 'wrench', 'hammer', 'drill', 'hard-hat',

  // Saúde & Bem-estar
  'heart', 'heartbeat', 'heart-pulse', 'heart-crack', 'stethoscope', 'pill',
  'pill-bottle', 'syringe', 'hospital', 'bandage', 'bone', 'thermometer',
  'microscope', 'test-tube', 'test-tubes', 'weight', 'dumbbell',

  // Educação & Escritório
  'graduation-cap', 'book', 'book-open', 'bookmark', 'library', 'pencil',
  'pen', 'clipboard', 'paperclip', 'ruler', 'backpack', 'calculator',
  'briefcase', 'globe', 'map', 'compass',

  // Tecnologia
  'phone', 'laptop', 'computer', 'tv', 'tablet', 'smartphone', 'monitor',
  'camera', 'headphones', 'mouse', 'printer', 'hard-drive', 'usb', 'bluetooth',
  'radio', 'speaker', 'gamepad', 'keyboard', 'mic', 'film', 'music',

  // Natureza & Animais
  'leaf', 'tree', 'tree-deciduous', 'flower', 'flower-2', 'sprout', 'sun',
  'moon', 'star', 'cloud', 'droplet', 'raindrops', 'waves', 'wind', 'snowflake',
  'cat', 'rabbit', 'snail', 'turtle', 'fish', 'paw-print', 'pet',

  // Esportes & Lazer
  'smile', 'smile-plus', 'laugh', 'meh', 'frown', 'celebration', 'party-popper',
  'trophy', 'medal', 'star', 'zap', 'fire', 'crown', 'plane', 'palette',
  'music', 'camera', 'clapperboard', 'ticket', 'dices', 'target',

  // People & Fashion
  'user', 'users', 'shirt', 'shoe', 'glasses', 'watch', 'ring', 'bag',

  // Misc
  'help-circle', 'info', 'shield', 'lock', 'unlock', 'trash', 'trash-2',
  'settings', 'cog', 'sliders-horizontal', 'filter', 'search', 'bell',
  'clock', 'calendar', 'flag', 'pin', 'link', 'plus-circle', 'minus-circle',
  'check-circle', 'alert-circle', 'x-circle',
]

export function EditCategoryModal({ categoria, onClose, onSubmit }: EditCategoryModalProps) {
  const [nome, setNome] = useState(categoria.nome)
  const [icone, setIcone] = useState(categoria.icone)
  const [cor, setCor] = useState(categoria.corHexadecimal)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nome.trim()) {
      e.nome = 'Nome é obrigatório'
    } else if (nome.length > 100) {
      e.nome = 'Nome deve ter no máximo 100 caracteres'
    }

    if (!icone) {
      e.icone = 'Ícone é obrigatório'
    }

    if (!cor) {
      e.cor = 'Cor é obrigatória'
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      e.cor = 'Cor deve ser um hexadecimal válido'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(categoria.id, {
        nome: nome.trim(),
        icone,
        corHexadecimal: cor,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-editar-categoria-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-editar-categoria-title">Editar Categoria</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loading}>✕</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {/* Nome */}
          <div className="form-group">
            <label htmlFor="editar-cat-nome">Nome da Categoria</label>
            <input
              id="editar-cat-nome"
              type="text"
              placeholder="Ex: Supermercado Mensal"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={errors.nome ? 'error' : ''}
              maxLength={100}
              disabled={loading}
            />
            {errors.nome && <p className="form-error">{errors.nome}</p>}
          </div>

          {/* Ícone */}
          <div className="form-group">
            <label>Selecione um Ícone</label>
            <div className="icon-grid">
              {COMMON_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcone(iconName)}
                  className={`icon-grid__btn ${icone === iconName ? 'icon-grid__btn--selected' : ''}`}
                  title={iconName}
                  disabled={loading}
                >
                  <CategoryIcon name={iconName} color={icone === iconName ? cor : 'var(--muted)'} size={22} />
                </button>
              ))}
            </div>
            {errors.icone && <p className="form-error">{errors.icone}</p>}
          </div>

          {/* Cor */}
          <div className="form-group">
            <label>Selecione uma Cor</label>
            <ColorPicker color={cor} onChange={setCor} />
            {errors.cor && <p className="form-error">{errors.cor}</p>}
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading} id="btn-salvar-categoria">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
