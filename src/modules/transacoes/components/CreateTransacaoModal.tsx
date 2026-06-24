import { useState, FormEvent, useEffect, useCallback, useRef } from 'react'
import {
  TransacaoCriacaoRequest,
  TipoTransacao,
  Conta,
  Tag,
  Category,
  Cartao,
} from '../../../types'
import { contaService } from '../../../services/contaService'
import { tagService } from '../../../services/tagService'
import { cartaoService } from '../../../services/cartaoService'
import { categoryService } from '../../../services/categoryService'

interface CreateTransacaoModalProps {
  onClose: () => void
  onSubmit: (data: TransacaoCriacaoRequest) => Promise<void>
  initialCartaoId?: string
  initialTipo?: TipoTransacao
  initialContaId?: string
}

export function CreateTransacaoModal({ onClose, onSubmit, initialCartaoId, initialTipo, initialContaId }: CreateTransacaoModalProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<TipoTransacao>(initialTipo || 'SAQUE')
  const [contaOrigemId, setContaOrigemId] = useState(initialContaId || '')
  const [contaDestinoId, setContaDestinoId] = useState(initialContaId || '')
  const [cartaoId, setCartaoId] = useState(initialCartaoId || '')
  const [categoriaId, setCategoriaId] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0])
  const [dataExibicao, setDataExibicao] = useState(() => {
    const today = new Date()
    const d = String(today.getDate()).padStart(2, '0')
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const y = today.getFullYear()
    return `${d}/${m}/${y}`
  })
  const [totalParcelas, setTotalParcelas] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const handleDataChange = (valStr: string) => {
    let val = valStr.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    let formatted = val
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    setDataExibicao(formatted)

    if (val.length === 8) {
      const day = val.slice(0, 2)
      const month = val.slice(2, 4)
      const year = val.slice(4)
      setData(`${year}-${month}-${day}`)
    } else {
      setData('')
    }
  }

  const [contas, setContas] = useState<Conta[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [categorias, setCategorias] = useState<Category[]>([])

  const [loadingData, setLoadingData] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null)

  // ─── Carregar dados iniciais ─────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingData(true)
      try {
        const [contasRes, tagsRes, cartoesRes, catsRes] = await Promise.all([
          contaService.getAll(),
          tagService.getAll(),
          cartaoService.getAll(),
          categoryService.getAll(),
        ])
        setContas(contasRes.data)
        setTags(tagsRes.data)
        setCartoes(cartoesRes.data)
        setCategorias(catsRes.data)
      } catch {
        // Ignora erro no pré-carregamento
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // ─── Sugestão de Categorização Inteligente via IA ─────────────────
  const [iaSugestao, setIaSugestao] = useState<{ categoriaId: string; categoriaNome: string; justificativa: string } | null>(null)
  const [carregandoIa, setCarregandoIa] = useState(false)

  const categorizarComIa = useCallback(async (desc: string) => {
    if (desc.trim().length < 3 || ['DEPOSITO', 'SAQUE'].includes(tipo)) {
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
  }, [tipo])

  useEffect(() => {
    if (debounceRef[0]) clearTimeout(debounceRef[0])
    const id = setTimeout(() => {
      categorizarComIa(descricao)
    }, 500)
    debounceRef[0] = id
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descricao])

  const [criandoCategoriaPorIa, setCriandoCategoriaPorIa] = useState(false)

  async function aplicarSugestao() {
    if (!iaSugestao) return
    if (iaSugestao.categoriaId) {
      setCategoriaId(iaSugestao.categoriaId)
      setIaSugestao(null)
    } else {
      // Criar nova categoria
      setCriandoCategoriaPorIa(true)
      try {
        const { categoryService } = await import('../../../services/categoryService')
        const novaCatRes = await categoryService.create({
          nome: iaSugestao.categoriaNome,
          corHexadecimal: '#8A05BE',
          icone: 'FaQuestion'
        })
        const novaCat = novaCatRes.data
        // Atualiza a lista de categorias locais
        setCategorias((prev) => [...prev, novaCat])
        setCategoriaId(novaCat.id)
        setIaSugestao(null)
      } catch {
        // Ignora erro
      } finally {
        setCriandoCategoriaPorIa(false)
      }
    }
  }

  // ─── Toggle tag ──────────────────────────────────────────────
  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  // ─── Validação ───────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (tipo === 'COMPRA_CREDITO' && !descricao.trim()) e.descricao = 'Descrição é obrigatória'
    const v = parseFloat(valor)
    if (valor === '' || isNaN(v) || v <= 0) e.valor = 'Valor deve ser maior que zero'
    if (!tipo) e.tipo = 'Tipo é obrigatório'
    if (tipo === 'COMPRA_CREDITO' && !cartaoId) e.cartaoId = 'Cartão é obrigatório'
    if (!['DEPOSITO', 'SAQUE', 'PIX'].includes(tipo) && !categoriaId) e.categoriaId = 'Categoria é obrigatória'
    if (!data) e.data = 'Data inválida (formato DD/MM/AAAA)'

    // Conta destino obrigatória para DEPOSITO e TRANSFERENCIA
    if ((tipo === 'DEPOSITO' || tipo === 'TRANSFERENCIA') && !contaDestinoId) {
      e.contaDestinoId = 'Conta destino é obrigatória'
    }
    // Conta origem obrigatória para SAQUE, PIX, TRANSFERENCIA
    if ((tipo === 'SAQUE' || tipo === 'PIX' || tipo === 'TRANSFERENCIA') && !contaOrigemId) {
      e.contaOrigemId = 'Conta origem é obrigatória'
    }

    if (tipo === 'COMPRA_CREDITO') {
      const p = parseInt(totalParcelas, 10)
      if (totalParcelas !== '' && (isNaN(p) || p < 1 || p > 120)) {
        e.totalParcelas = 'Parcelas deve ser entre 1 e 120'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Submit ──────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: TransacaoCriacaoRequest = {
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      tipo,
      contaOrigemId: contaOrigemId || undefined,
      contaDestinoId: contaDestinoId || undefined,
      cartaoId: cartaoId || undefined,
      categoriaId: categoriaId || undefined,
      data,
      totalParcelas: tipo === 'COMPRA_CREDITO' && totalParcelas ? parseInt(totalParcelas, 10) : undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    }

    setLoadingSubmit(true)
    try {
      await onSubmit(payload)
    } finally {
      setLoadingSubmit(false)
    }
  }

  function requiresContaOrigem(): boolean {
    return ['SAQUE', 'PIX', 'TRANSFERENCIA'].includes(tipo)
  }

  function requiresContaDestino(): boolean {
    return ['DEPOSITO', 'TRANSFERENCIA'].includes(tipo)
  }

  function requiresCartao(): boolean {
    return tipo === 'COMPRA_CREDITO'
  }

  function requiresCategoria(): boolean {
    return !['DEPOSITO', 'SAQUE'].includes(tipo)
  }

  const getTipoLabel = (t: TipoTransacao): string => {
    const labels: Record<TipoTransacao, string> = {
      DEPOSITO: 'Depósito',
      SAQUE: 'Saque',
      PIX: 'Pix',
      COMPRA_CREDITO: 'Compra no Crédito',
      TRANSFERENCIA: 'Transferência',
      PAGAMENTO_CREDITO: 'Pagamento de Fatura',
    }
    return labels[t]
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-criar-transacao-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-criar-transacao-title">Nova Transação</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={loadingSubmit}>
            ✕
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {loadingData && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center' }}>
              Carregando dados...
            </p>
          )}

          {/* Descrição */}
          <div className="form-group">
            <label htmlFor="criar-transacao-descricao">
              Descrição {tipo !== 'COMPRA_CREDITO' && '(opcional)'}
            </label>
            <input
              id="criar-transacao-descricao"
              type="text"
              placeholder="Ex: Supermercado"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={errors.descricao ? 'error' : ''}
              maxLength={200}
              disabled={loadingSubmit}
            />
            {errors.descricao && <p className="form-error">{errors.descricao}</p>}

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
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>{iaSugestao.justificativa}</div>
              </div>
            )}
          </div>

          {/* Valor */}
          <div className="form-group">
            <label htmlFor="criar-transacao-valor">Valor (R$)</label>
            <input
              id="criar-transacao-valor"
              type="number"
              placeholder="0.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={errors.valor ? 'error' : ''}
              min="0.01"
              step="0.01"
              disabled={loadingSubmit}
            />
            {errors.valor && <p className="form-error">{errors.valor}</p>}
          </div>

          {/* Tipo */}
          <div className="form-group">
            <label htmlFor="criar-transacao-tipo">Tipo</label>
            <select
              id="criar-transacao-tipo"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoTransacao)
                // Limpar campos condicionais ao trocar tipo
                if (!['SAQUE', 'PIX', 'TRANSFERENCIA'].includes(e.target.value)) {
                  setContaOrigemId('')
                }
                if (!['DEPOSITO', 'TRANSFERENCIA'].includes(e.target.value)) {
                  setContaDestinoId('')
                }
                if (e.target.value !== 'COMPRA_CREDITO') {
                  setCartaoId('')
                  setTotalParcelas('')
                }
              }}
              className={errors.tipo ? 'error' : ''}
              disabled={loadingSubmit}
            >
              {(['DEPOSITO', 'SAQUE', 'PIX', 'COMPRA_CREDITO', 'TRANSFERENCIA'] as TipoTransacao[]).map((t) => (
                <option key={t} value={t}>{getTipoLabel(t)}</option>
              ))}
            </select>
            {errors.tipo && <p className="form-error">{errors.tipo}</p>}
          </div>

          {/* Conta Origem (condicional) */}
          {requiresContaOrigem() && (
            <div className="form-group">
              <label htmlFor="criar-transacao-conta-origem">Conta Origem</label>
              <select
                id="criar-transacao-conta-origem"
                value={contaOrigemId}
                onChange={(e) => setContaOrigemId(e.target.value)}
                className={errors.contaOrigemId ? 'error' : ''}
                disabled={loadingSubmit}
              >
                <option value="">Selecione uma conta</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {errors.contaOrigemId && <p className="form-error">{errors.contaOrigemId}</p>}
            </div>
          )}

          {/* Conta Destino (condicional) */}
          {requiresContaDestino() && (
            <div className="form-group">
              <label htmlFor="criar-transacao-conta-destino">Conta Destino</label>
              <select
                id="criar-transacao-conta-destino"
                value={contaDestinoId}
                onChange={(e) => setContaDestinoId(e.target.value)}
                className={errors.contaDestinoId ? 'error' : ''}
                disabled={loadingSubmit}
              >
                <option value="">Selecione uma conta</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {errors.contaDestinoId && <p className="form-error">{errors.contaDestinoId}</p>}
            </div>
          )}

          {/* Cartão (condicional - apenas COMPRA_CREDITO) */}
          {requiresCartao() && (
            <>
              <div className="form-group">
                <label htmlFor="criar-transacao-cartao">Cartão de Crédito</label>
                <select
                  id="criar-transacao-cartao"
                  value={cartaoId}
                  onChange={(e) => setCartaoId(e.target.value)}
                  className={errors.cartaoId ? 'error' : ''}
                  disabled={loadingSubmit}
                >
                  <option value="">Selecione um cartão</option>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                {errors.cartaoId && <p className="form-error">{errors.cartaoId}</p>}
              </div>

              {/* Total Parcelas (apenas COMPRA_CREDITO) */}
              <div className="form-group">
                <label htmlFor="criar-transacao-parcelas">Total de Parcelas (opcional)</label>
                <input
                  id="criar-transacao-parcelas"
                  type="number"
                  placeholder="1"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  className={errors.totalParcelas ? 'error' : ''}
                  min="1"
                  max="120"
                  step="1"
                  disabled={loadingSubmit}
                />
                {errors.totalParcelas && <p className="form-error">{errors.totalParcelas}</p>}
              </div>
            </>
          )}

          {/* Categoria */}
          {requiresCategoria() && (
            <div className="form-group">
              <label htmlFor="criar-transacao-categoria">Categoria</label>
              <select
                id="criar-transacao-categoria"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className={errors.categoriaId ? 'error' : ''}
                disabled={loadingSubmit}
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
              {errors.categoriaId && <p className="form-error">{errors.categoriaId}</p>}
            </div>
          )}

          {/* Data */}
          <div className="form-group">
            <label htmlFor="criar-transacao-data">Data</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="criar-transacao-data"
                type="text"
                placeholder="DD/MM/AAAA"
                value={dataExibicao}
                onChange={(e) => handleDataChange(e.target.value)}
                className={errors.data ? 'error' : ''}
                disabled={loadingSubmit}
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <input
                ref={dateInputRef}
                type="date"
                value={data}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  if (selectedDate) {
                    const parts = selectedDate.split('-')
                    handleDataChange(`${parts[2]}/${parts[1]}/${parts[0]}`)
                  }
                }}
                disabled={loadingSubmit}
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
              <span 
                style={{ position: 'absolute', right: '12px', cursor: 'pointer', zIndex: 3 }}
                onClick={() => dateInputRef.current?.showPicker()}
              >
                📅
              </span>
            </div>
            {errors.data && <p className="form-error">{errors.data}</p>}
          </div>

          {/* Tags (multi-select) */}
          {tags.length > 0 && (
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-selector">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <span
                      key={tag.id}
                      className={`tag-chip ${selected ? 'tag-chip--selected' : 'tag-chip--unselected'}`}
                      style={{
                        color: tag.corHexadecimal,
                        borderColor: selected ? tag.corHexadecimal : 'transparent',
                        background: selected ? `${tag.corHexadecimal}15` : 'transparent',
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.nome}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loadingSubmit}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loadingSubmit || loadingData}>
              {loadingSubmit ? 'Salvando...' : 'Criar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}