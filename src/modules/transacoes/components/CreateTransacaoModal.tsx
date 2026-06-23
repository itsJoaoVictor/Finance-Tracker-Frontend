import { useState, FormEvent, useEffect, useCallback } from 'react'
import {
  TransacaoCriacaoRequest,
  TipoTransacao,
  Conta,
  Tag,
  Category,
  Cartao,
  SugestaoResponse,
} from '../../../types'
import { transacaoService } from '../../../services/transacaoService'
import { contaService } from '../../../services/contaService'
import { tagService } from '../../../services/tagService'
import { cartaoService } from '../../../services/cartaoService'
import { categoryService } from '../../../services/categoryService'

interface CreateTransacaoModalProps {
  onClose: () => void
  onSubmit: (data: TransacaoCriacaoRequest) => Promise<void>
}

export function CreateTransacaoModal({ onClose, onSubmit }: CreateTransacaoModalProps) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<TipoTransacao>('SAQUE')
  const [contaOrigemId, setContaOrigemId] = useState('')
  const [contaDestinoId, setContaDestinoId] = useState('')
  const [cartaoId, setCartaoId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [totalParcelas, setTotalParcelas] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const [contas, setContas] = useState<Conta[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [categorias, setCategorias] = useState<Category[]>([])

  const [sugestao, setSugestao] = useState<SugestaoResponse | null>(null)
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

  // ─── Sugestão ao digitar descrição ───────────────────────────
  const sugerir = useCallback(async (desc: string) => {
    if (desc.trim().length < 3) {
      setSugestao(null)
      return
    }
    try {
      const res = await transacaoService.sugerir(desc.trim())
      setSugestao(res.data)
    } catch {
      setSugestao(null)
    }
  }, [])

  useEffect(() => {
    if (debounceRef[0]) clearTimeout(debounceRef[0])
    const id = setTimeout(() => {
      sugerir(descricao)
    }, 400)
    debounceRef[0] = id
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descricao])

  function aplicarSugestao() {
    if (!sugestao) return
    if (sugestao.categoriaId) setCategoriaId(sugestao.categoriaId)
    if (sugestao.tagIds) setSelectedTagIds(sugestao.tagIds)
    setSugestao(null)
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
    if (!descricao.trim()) e.descricao = 'Descrição é obrigatória'
    const v = parseFloat(valor)
    if (valor === '' || isNaN(v) || v <= 0) e.valor = 'Valor deve ser maior que zero'
    if (!tipo) e.tipo = 'Tipo é obrigatório'
    if (tipo === 'COMPRA_CREDITO' && !cartaoId) e.cartaoId = 'Cartão é obrigatório'
    if (!categoriaId) e.categoriaId = 'Categoria é obrigatória'
    if (!data) e.data = 'Data é obrigatória'

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
      categoriaId,
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
            <label htmlFor="criar-transacao-descricao">Descrição</label>
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

            {/* Sugestão */}
            {sugestao && (
              <div className="suggestion-badge" onClick={aplicarSugestao}>
                💡 Sugestão: {sugestao.categoriaNome || 'categoria'} detectada
                {sugestao.tags && sugestao.tags.length > 0 && (
                  <> · {sugestao.tags.map((t) => t.nome).join(', ')}</>
                )}
                (clique para aplicar)
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

          {/* Data */}
          <div className="form-group">
            <label htmlFor="criar-transacao-data">Data</label>
            <input
              id="criar-transacao-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={errors.data ? 'error' : ''}
              disabled={loadingSubmit}
            />
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