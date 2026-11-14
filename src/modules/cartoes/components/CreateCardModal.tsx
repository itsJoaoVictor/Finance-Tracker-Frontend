import { useState, FormEvent } from 'react'
import { CartaoCriacaoRequest, Conta } from '../../../types'
import { FormModal } from '../../../components/FormModal'
import '../cartoes.css'

interface CreateCardModalProps {
  contas: Conta[]
  onClose: () => void
  onSubmit: (data: CartaoCriacaoRequest) => Promise<void>
}

const BANK_COLOR_PRESETS = [
  { label: 'Nubank', hex: '#8A05BE' },
  { label: 'Banco do Brasil', hex: '#EAB308' },
  { label: 'Inter', hex: '#FF7A00' },
  { label: 'Itaú', hex: '#EC7000' },
  { label: 'Bradesco', hex: '#CC092F' },
  { label: 'Santander', hex: '#CC0000' },
  { label: 'C6 / Black', hex: '#1E293B' },
  { label: 'Azul', hex: '#2563EB' },
  { label: 'Esmeralda', hex: '#10B981' }
]

export function CreateCardModal({ contas, onClose, onSubmit }: CreateCardModalProps) {
  const defaultConta = contas.find((c) => c.id === (contas[0]?.id || ''))
  const [nome, setNome] = useState(defaultConta?.nome || '')
  const [limite, setLimite] = useState('')
  const [diaFechamento, setDiaFechamento] = useState('5')
  const [diaVencimento, setDiaVencimento] = useState('12')
  const [contaId, setContaId] = useState(contas[0]?.id || '')
  const [cor, setCor] = useState(defaultConta?.corHexadecimal || '#8A05BE')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleContaChange = (id: string) => {
    setContaId(id)
    const selecionada = contas.find((c) => c.id === id)
    if (selecionada) {
      if (selecionada.corHexadecimal) {
        setCor(selecionada.corHexadecimal)
      }
      setNome(selecionada.nome)
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    const lim = parseFloat(limite)
    if (limite === '' || isNaN(lim)) e.limite = 'Limite é obrigatório'
    else if (lim < 0) e.limite = 'Limite não pode ser negativo'

    const df = parseInt(diaFechamento)
    if (isNaN(df) || df < 1 || df > 31)
      e.diaFechamento = 'Dia de fechamento inválido (deve ser entre 1 e 31)'

    const dv = parseInt(diaVencimento)
    if (isNaN(dv) || dv < 1 || dv > 31)
      e.diaVencimento = 'Dia de vencimento inválido (deve ser entre 1 e 31)'

    if (!contaId) e.contaId = 'Deve selecionar uma conta vinculada'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const selecionada = contas.find((c) => c.id === contaId)
    const cardName = selecionada ? selecionada.nome : nome
    setLoading(true)
    try {
      await onSubmit({
        nome: cardName.trim() || 'Cartão',
        limite: parseFloat(limite),
        diaFechamento: parseInt(diaFechamento),
        diaVencimento: parseInt(diaVencimento),
        contaId,
        corHexadecimal: cor
      })
    } finally {
      setLoading(false)
    }
  }

  const selecionadaConta = contas.find((c) => c.id === contaId)
  const previewNome = selecionadaConta?.nome || nome || 'Novo Cartão'
  const previewLimite =
    limite && !isNaN(parseFloat(limite))
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          parseFloat(limite)
        )
      : 'R$ 0,00'

  return (
    <FormModal
      titulo="Novo Cartão de Crédito"
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={loading}
    >
      {/* Mini-Preview ao vivo do Cartão */}
      <div
        className="card-modal-live-preview"
        style={{ '--card-brand': cor } as React.CSSProperties}
      >
        <div className="card-modal-live-preview__top">
          <span className="card-modal-live-preview__brand">{previewNome}</span>
          <div className="card-modal-live-preview__chip" />
        </div>
        <div className="card-modal-live-preview__bottom">
          <div>
            <span className="card-modal-live-preview__label">Limite Total</span>
            <strong className="card-modal-live-preview__value">{previewLimite}</strong>
          </div>
          <div className="card-modal-live-preview__dates">
            <span>Fecha dia {diaFechamento || '--'}</span>
            <span>•</span>
            <span>Vence dia {diaVencimento || '--'}</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="criar-cartao-limite">Limite de Crédito (R$)</label>
        <input
          id="criar-cartao-limite"
          type="number"
          placeholder="0.00"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          className={errors.limite ? 'error' : ''}
          min="0"
          step="0.01"
        />
        {errors.limite && <p className="form-error">{errors.limite}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label htmlFor="criar-cartao-fechamento">Dia de Fechamento</label>
          <input
            id="criar-cartao-fechamento"
            type="number"
            min="1"
            max="31"
            value={diaFechamento}
            onChange={(e) => setDiaFechamento(e.target.value)}
            className={errors.diaFechamento ? 'error' : ''}
          />
          {errors.diaFechamento && <p className="form-error">{errors.diaFechamento}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="criar-cartao-vencimento">Dia de Vencimento</label>
          <input
            id="criar-cartao-vencimento"
            type="number"
            min="1"
            max="31"
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(e.target.value)}
            className={errors.diaVencimento ? 'error' : ''}
          />
          {errors.diaVencimento && <p className="form-error">{errors.diaVencimento}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="criar-cartao-conta">Conta Bancária Vinculada</label>
        <select
          id="criar-cartao-conta"
          value={contaId}
          onChange={(e) => handleContaChange(e.target.value)}
          className={errors.contaId ? 'error' : ''}
        >
          <option value="" disabled>
            Selecione uma conta...
          </option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        {errors.contaId && <p className="form-error">{errors.contaId}</p>}
      </div>

      <div className="form-group">
        <label>Cor e Identidade do Cartão</label>
        <div className="bank-color-swatches">
          {BANK_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              className={`bank-color-swatch ${
                cor.toLowerCase() === preset.hex.toLowerCase() ? 'active' : ''
              }`}
              style={{ backgroundColor: preset.hex }}
              onClick={() => setCor(preset.hex)}
              title={preset.label}
              aria-label={preset.label}
            />
          ))}
          <div className="bank-color-custom">
            <input
              id="criar-cartao-cor"
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              title="Cor personalizada"
            />
            <span className="bank-color-hex">{cor.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="modal__actions">
        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Cartão'}
        </button>
      </div>
    </FormModal>
  )
}
