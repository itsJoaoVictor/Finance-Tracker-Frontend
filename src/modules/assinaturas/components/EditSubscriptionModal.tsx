import { useState, FormEvent } from 'react'
import { Assinatura, AssinaturaEdicaoRequest, Cartao, Category } from '../../../types'
import { FormModal } from '../../../components/FormModal'

interface EditSubscriptionModalProps {
  assinatura: Assinatura
  cartoes: Cartao[]
  categorias: Category[]
  onClose: () => void
  onSubmit: (id: string, data: AssinaturaEdicaoRequest) => Promise<void>
}

export function EditSubscriptionModal({
  assinatura,
  cartoes,
  categorias,
  onClose,
  onSubmit,
}: EditSubscriptionModalProps) {
  const [nome, setNome] = useState(assinatura.nome)
  const [valor, setValor] = useState(assinatura.valor.toString())
  const [cartaoId, setCartaoId] = useState(assinatura.cartaoId)
  const [categoriaId, setCategoriaId] = useState(assinatura.categoriaId)
  const [tipoRecorrencia, setTipoRecorrencia] = useState(assinatura.tipoRecorrencia)
  const [frequencia, setFrequencia] = useState(assinatura.frequencia?.toString() || '')
  const [unidadeFrequencia, setUnidadeFrequencia] = useState(assinatura.unidadeFrequencia || 'MESES')
  const [diaCobranca, setDiaCobranca] = useState(assinatura.diaCobranca.toString())
  const formatISOToBr = (isoStr: string) => {
    const parts = isoStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return isoStr
  }

  const [dataInicio, setDataInicio] = useState(assinatura.dataInicio.split('T')[0] || assinatura.dataInicio)
  const [dataInicioExibicao, setDataInicioExibicao] = useState(() => formatISOToBr(assinatura.dataInicio.split('T')[0] || assinatura.dataInicio))
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleDataInicioChange = (valStr: string) => {
    let val = valStr.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    let formatted = val
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    setDataInicioExibicao(formatted)

    if (val.length === 8) {
      const day = val.slice(0, 2)
      const month = val.slice(2, 4)
      const year = val.slice(4)
      setDataInicio(`${year}-${month}-${day}`)
    } else {
      setDataInicio('')
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}

    if (!nome.trim()) e.nome = 'Nome da assinatura é obrigatório'

    const val = parseFloat(valor)
    if (valor === '' || isNaN(val)) e.valor = 'Valor é obrigatório'
    else if (val < 0) e.valor = 'Valor não pode ser negativo'

    if (!cartaoId) e.cartaoId = 'Selecione um cartão'
    if (!categoriaId) e.categoriaId = 'Selecione uma categoria'

    const dc = parseInt(diaCobranca)
    if (isNaN(dc) || dc < 1 || dc > 31) e.diaCobranca = 'Dia de cobrança inválido (1-31)'

    if (!dataInicio) e.dataInicio = 'Data de início inválida (formato DD/MM/AAAA)'

    if (tipoRecorrencia === 'PERSONALIZADO') {
      const freq = parseInt(frequencia)
      if (frequencia === '' || isNaN(freq) || freq < 1) e.frequencia = 'Frequência deve ser um número maior que 0'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload: AssinaturaEdicaoRequest = {
        nome: nome.trim(),
        valor: parseFloat(valor),
        cartaoId,
        categoriaId,
        tipoRecorrencia,
        diaCobranca: parseInt(diaCobranca),
        dataInicio,
      }

      if (tipoRecorrencia === 'PERSONALIZADO') {
        payload.frequencia = parseInt(frequencia)
        payload.unidadeFrequencia = unidadeFrequencia
      }

      await onSubmit(assinatura.id, payload)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      titulo="Editar Assinatura"
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={loading}
    >
      {/* Nome */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-nome">Nome</label>
        <input
          id="editar-assinatura-nome"
          type="text"
          placeholder="Ex: Netflix"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={errors.nome ? 'error' : ''}
          maxLength={100}
        />
        {errors.nome && <p className="form-error">{errors.nome}</p>}
      </div>

      {/* Valor */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-valor">Valor (R$)</label>
        <input
          id="editar-assinatura-valor"
          type="number"
          placeholder="0.00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className={errors.valor ? 'error' : ''}
          min="0"
          step="0.01"
        />
        {errors.valor && <p className="form-error">{errors.valor}</p>}
      </div>

      {/* Cartao */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-cartao">Cartão de Crédito</label>
        <select
          id="editar-assinatura-cartao"
          value={cartaoId}
          onChange={(e) => setCartaoId(e.target.value)}
          className={errors.cartaoId ? 'error' : ''}
        >
          <option value="" disabled>Selecione um cartão...</option>
          {cartoes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.cartaoId && <p className="form-error">{errors.cartaoId}</p>}
      </div>

      {/* Categoria */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-categoria">Categoria</label>
        <select
          id="editar-assinatura-categoria"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className={errors.categoriaId ? 'error' : ''}
        >
          <option value="" disabled>Selecione uma categoria...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {errors.categoriaId && <p className="form-error">{errors.categoriaId}</p>}
      </div>

      {/* Tipo Recorrencia */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-recorrencia">Recorrência</label>
        <select
          id="editar-assinatura-recorrencia"
          value={tipoRecorrencia}
          onChange={(e) => setTipoRecorrencia(e.target.value as typeof tipoRecorrencia)}
        >
          <option value="MENSAL">Mensal</option>
          <option value="ANUAL">Anual</option>
          <option value="TRIMESTRAL">Trimestral</option>
          <option value="PERSONALIZADO">Personalizado</option>
        </select>
      </div>

      {/* Campos personalizados */}
      {tipoRecorrencia === 'PERSONALIZADO' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="editar-assinatura-frequencia">Frequência</label>
            <input
              id="editar-assinatura-frequencia"
              type="number"
              min="1"
              placeholder="Ex: 2"
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
              className={errors.frequencia ? 'error' : ''}
            />
            {errors.frequencia && <p className="form-error">{errors.frequencia}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="editar-assinatura-unidade">Unidade</label>
            <select
              id="editar-assinatura-unidade"
              value={unidadeFrequencia}
              onChange={(e) => setUnidadeFrequencia(e.target.value as typeof unidadeFrequencia)}
            >
              <option value="SEMANAS">Semanas</option>
              <option value="MESES">Meses</option>
              <option value="ANOS">Anos</option>
            </select>
          </div>
        </div>
      )}

      {/* Dia Cobranca */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-dia">Dia da Cobrança</label>
        <input
          id="editar-assinatura-dia"
          type="number"
          min="1"
          max="31"
          placeholder="1 a 31"
          value={diaCobranca}
          onChange={(e) => setDiaCobranca(e.target.value)}
          className={errors.diaCobranca ? 'error' : ''}
        />
        {errors.diaCobranca && <p className="form-error">{errors.diaCobranca}</p>}
      </div>

      {/* Data Inicio */}
      <div className="form-group">
        <label htmlFor="editar-assinatura-data">Data de Início</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="editar-assinatura-data"
            type="text"
            placeholder="DD/MM/AAAA"
            value={dataInicioExibicao}
            onChange={(e) => handleDataInicioChange(e.target.value)}
            className={errors.dataInicio ? 'error' : ''}
            style={{ paddingRight: '40px', width: '100%' }}
          />
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              const selectedDate = e.target.value
              if (selectedDate) {
                const parts = selectedDate.split('-')
                handleDataInicioChange(`${parts[2]}/${parts[1]}/${parts[0]}`)
              }
            }}
            style={{
              position: 'absolute',
              right: '10px',
              width: '24px',
              height: '24px',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 2
            }}
          />
          <span style={{ position: 'absolute', right: '12px', pointerEvents: 'none', zIndex: 1 }}>
            📅
          </span>
        </div>
        {errors.dataInicio && <p className="form-error">{errors.dataInicio}</p>}
      </div>

      {/* Acoes */}
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
