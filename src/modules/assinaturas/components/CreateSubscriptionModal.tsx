import { useState, FormEvent, useEffect, useCallback } from 'react'
import { AssinaturaCriacaoRequest, Cartao, Category } from '../../../types'
import { FormModal } from '../../../components/FormModal'

interface CreateSubscriptionModalProps {
  cartoes: Cartao[]
  categorias: Category[]
  onClose: () => void
  onSubmit: (data: AssinaturaCriacaoRequest) => Promise<void>
  onAddCategoryLocal?: (newCat: Category) => void
}

export function CreateSubscriptionModal({
  cartoes,
  categorias,
  onClose,
  onSubmit,
  onAddCategoryLocal,
}: CreateSubscriptionModalProps) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id || '')
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || '')
  const [tipoRecorrencia, setTipoRecorrencia] = useState<'MENSAL' | 'ANUAL' | 'TRIMESTRAL' | 'PERSONALIZADO'>('MENSAL')
  const [frequencia, setFrequencia] = useState('')
  const [unidadeFrequencia, setUnidadeFrequencia] = useState<'SEMANAS' | 'MESES' | 'ANOS'>('MESES')
  const [diaCobranca, setDiaCobranca] = useState('1')
  const [dataInicio, setDataInicio] = useState('')
  const [dataInicioExibicao, setDataInicioExibicao] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // IA Categorization states & logic
  const [iaSugestao, setIaSugestao] = useState<{ categoriaId: string; categoriaNome: string; justificativa: string } | null>(null)
  const [carregandoIa, setCarregandoIa] = useState(false)
  const [criandoCategoriaPorIa, setCriandoCategoriaPorIa] = useState(false)
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const categorizarComIa = useCallback(async (desc: string) => {
    if (desc.trim().length < 3) {
      setIaSugestao(null)
      return
    }
    setCarregandoIa(true)
    try {
      const { iaService } = await import('../../../services/iaService')
      const res = await iaService.categorizar(desc.trim())
      if (res.data) {
        setIaSugestao({
          categoriaId: res.data.categoriaId || '',
          categoriaNome: res.data.categoriaSugerida,
          justificativa: res.data.justificativa
        })
      } else {
        setIaSugestao(null)
      }
    } catch {
      setIaSugestao(null)
    } finally {
      setCarregandoIa(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef[0]) clearTimeout(debounceRef[0])
    const id = setTimeout(() => {
      categorizarComIa(nome)
    }, 500)
    debounceRef[0] = id
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome])

  async function aplicarSugestao() {
    if (!iaSugestao) return
    if (iaSugestao.categoriaId) {
      setCategoriaId(iaSugestao.categoriaId)
      setIaSugestao(null)
    } else {
      setCriandoCategoriaPorIa(true)
      try {
        const { categoryService } = await import('../../../services/categoryService')
        const novaCatRes = await categoryService.create({
          nome: iaSugestao.categoriaNome,
          corHexadecimal: '#8A05BE',
          icone: 'FaQuestion'
        })
        const novaCat = novaCatRes.data
        if (onAddCategoryLocal) {
          onAddCategoryLocal(novaCat)
        }
        setCategoriaId(novaCat.id)
        setIaSugestao(null)
      } catch {
        // Ignora erro
      } finally {
        setCriandoCategoriaPorIa(false)
      }
    }
  }

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
      setDiaCobranca(parseInt(day, 10).toString())
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
      const payload: AssinaturaCriacaoRequest = {
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

      await onSubmit(payload)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      titulo="Nova Assinatura"
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={loading}
    >
      {/* Nome */}
      <div className="form-group">
        <label htmlFor="criar-assinatura-nome">Nome</label>
        <input
          id="criar-assinatura-nome"
          type="text"
          placeholder="Ex: Netflix"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={errors.nome ? 'error' : ''}
          maxLength={100}
        />
        {errors.nome && <p className="form-error">{errors.nome}</p>}

        {/* Sugestão da IA */}
        {carregandoIa && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
            🤖 Inteligência Artificial analisando a descrição...
          </div>
        )}
        {iaSugestao && (
          <div className="suggestion-badge" onClick={aplicarSugestao} style={{ marginTop: '6px', cursor: 'pointer', background: 'rgba(138, 5, 190, 0.1)', border: '1px solid var(--primary)', borderRadius: '4px', padding: '6px 10px', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
            {criandoCategoriaPorIa ? (
              <span>⏳ Criando nova categoria '{iaSugestao.categoriaNome}'...</span>
            ) : (
              <span>
                🤖 Sugestão da IA: <strong>{iaSugestao.categoriaNome}</strong> {iaSugestao.categoriaId ? '(clique para aplicar)' : '(clique para criar categoria)'}
              </span>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{iaSugestao.justificativa}</div>
          </div>
        )}
      </div>

      {/* Valor */}
      <div className="form-group">
        <label htmlFor="criar-assinatura-valor">Valor (R$)</label>
        <input
          id="criar-assinatura-valor"
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
        <label htmlFor="criar-assinatura-cartao">Cartão de Crédito</label>
        <select
          id="criar-assinatura-cartao"
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
        <label htmlFor="criar-assinatura-categoria">Categoria</label>
        <select
          id="criar-assinatura-categoria"
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
        <label htmlFor="criar-assinatura-recorrencia">Recorrência</label>
        <select
          id="criar-assinatura-recorrencia"
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
            <label htmlFor="criar-assinatura-frequencia">Frequência</label>
            <input
              id="criar-assinatura-frequencia"
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
            <label htmlFor="criar-assinatura-unidade">Unidade</label>
            <select
              id="criar-assinatura-unidade"
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



      {/* Data Inicio */}
      <div className="form-group">
        <label htmlFor="criar-assinatura-data">Data de Início</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="criar-assinatura-data"
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
          {loading ? 'Salvando...' : 'Criar Assinatura'}
        </button>
      </div>
    </FormModal>
  )
}
