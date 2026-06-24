import { useState, FormEvent } from 'react'
import { Cartao, CartaoEdicaoRequest, Conta } from '../../../types'
import { FormModal } from '../../../components/FormModal'

interface EditCardModalProps {
  cartao: Cartao
  contas: Conta[]
  onClose: () => void
  onSubmit: (id: string, data: CartaoEdicaoRequest) => Promise<void>
}

export function EditCardModal({ cartao, contas, onClose, onSubmit }: EditCardModalProps) {
  const [nome, setNome] = useState(cartao.nome)
  const [limite, setLimite] = useState(cartao.limite.toString())
  const [diaFechamento, setDiaFechamento] = useState(cartao.diaFechamento.toString())
  const [diaVencimento, setDiaVencimento] = useState(cartao.diaVencimento.toString())
  const [contaId, setContaId] = useState(cartao.contaId)
  const [cor, setCor] = useState(cartao.corHexadecimal || '#8A05BE')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleContaChange = (id: string) => {
    setContaId(id)
    const selecionada = contas.find(c => c.id === id)
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
    if (isNaN(df) || df < 1 || df > 31) e.diaFechamento = 'Dia de fechamento inválido (deve ser entre 1 e 31)'

    const dv = parseInt(diaVencimento)
    if (isNaN(dv) || dv < 1 || dv > 31) e.diaVencimento = 'Dia de vencimento inválido (deve ser entre 1 e 31)'

    if (!contaId) e.contaId = 'Deve selecionar uma conta vinculada'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const selecionada = contas.find(c => c.id === contaId)
    const cardName = selecionada ? selecionada.nome : nome
    setLoading(true)
    try {
      await onSubmit(cartao.id, {
        nome: cardName.trim() || 'Cartão',
        limite: parseFloat(limite),
        diaFechamento: parseInt(diaFechamento),
        diaVencimento: parseInt(diaVencimento),
        contaId,
        corHexadecimal: cor,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      titulo="Editar Cartão de Crédito"
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={loading}
    >
      <div className="form-group">
        <label htmlFor="editar-cartao-limite">Limite de Crédito (R$)</label>
        <input
          id="editar-cartao-limite"
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
          <label htmlFor="editar-cartao-fechamento">Dia de Fechamento</label>
          <input
            id="editar-cartao-fechamento"
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
          <label htmlFor="editar-cartao-vencimento">Dia de Vencimento</label>
          <input
            id="editar-cartao-vencimento"
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
        <label htmlFor="editar-cartao-conta">Conta Bancária Vinculada</label>
        <select
          id="editar-cartao-conta"
          value={contaId}
          onChange={(e) => handleContaChange(e.target.value)}
          className={errors.contaId ? 'error' : ''}
        >
          {contas.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.contaId && <p className="form-error">{errors.contaId}</p>}
      </div>

      <div className="form-group">
        <label>Cor do Cartão</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="color-preview" style={{ background: cor, width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }} />
          <input
            id="editar-cartao-cor"
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
            {cor.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="modal__actions">
        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </FormModal>
  )
}
