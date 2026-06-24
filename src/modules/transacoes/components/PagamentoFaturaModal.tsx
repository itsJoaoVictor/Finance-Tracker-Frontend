import { useState, FormEvent, useEffect } from 'react'
import { PagamentoFaturaRequest, TipoPagamentoFatura, Conta, Cartao, Fatura } from '../../../types'
import { contaService } from '../../../services/contaService'
import { cartaoService } from '../../../services/cartaoService'

// Helper to parse dates in local timezone (avoiding UTC timezone shift issues)
function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  const cleanStr = dateStr.split('T')[0]
  const parts = cleanStr.split('-').map(Number)
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  return new Date(dateStr)
}

interface PagamentoFaturaModalProps {
  onClose: () => void
  onSubmit: (data: PagamentoFaturaRequest) => Promise<void>
  initialCartaoId?: string
}

export function PagamentoFaturaModal({ onClose, onSubmit, initialCartaoId }: PagamentoFaturaModalProps) {
  const [cartaoId, setCartaoId] = useState(initialCartaoId || '')
  const [faturaId, setFaturaId] = useState('')
  const [contaOrigemId, setContaOrigemId] = useState('')
  const [valor, setValor] = useState('')
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamentoFatura>('TOTAL')

  const [contas, setContas] = useState<Conta[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingFaturas, setLoadingFaturas] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fatura atualmente selecionada (para exibir avisos)
  const faturaAtual = faturas.find(f => f.id === faturaId) || null

  // Carrega contas e cartões no início
  useEffect(() => {
    async function load() {
      try {
        const [contasRes, cartoesRes] = await Promise.all([
          contaService.getAll(),
          cartaoService.getAll()
        ])
        setContas(contasRes.data)
        setCartoes(cartoesRes.data)
      } catch (err) {
        console.error('Erro ao carregar dados iniciais para pagamento de fatura', err)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // Carrega as faturas do cartão selecionado
  useEffect(() => {
    if (!cartaoId) {
      setFaturas([])
      setFaturaId('')
      return
    }

    async function loadFaturas() {
      setLoadingFaturas(true)
      try {
        const res = await cartaoService.getFaturas(cartaoId)
        
        // Filtra apenas faturas que não estejam totalmente pagas e que não tenham sido migradas por rollover
        const faturasNaoPagas = res.data.filter(f => {
          if (f.status === 'ATRASADA' && f.rolladoOver) {
            return false;
          }
          return f.valorTotal > f.valorPago;
        });

        // Ordena faturas não pagas de forma cronológica (a mais antiga primeiro)
        const sortedCronologico = [...faturasNaoPagas].sort(
          (a, b) => new Date(a.mesReferencia).getTime() - new Date(b.mesReferencia).getTime()
        );

        // Apenas a mais antiga pendente pode ser paga (ou seja, se a atual foi paga, a próxima passa a ser pagável)
        const faturasPendentes = sortedCronologico.slice(0, 1);
        
        // Ordena faturas: faturas FECHADAS/ATRASADAS primeiro, e depois ordem cronológica
        const sorted = [...faturasPendentes].sort((a, b) => {
          if (a.status !== 'ABERTA' && b.status === 'ABERTA') return -1
          if (a.status === 'ABERTA' && b.status !== 'ABERTA') return 1
          return new Date(a.mesReferencia).getTime() - new Date(b.mesReferencia).getTime()
        })
        
        setFaturas(sorted)

        if (sorted.length > 0) {
          const defaultFatura = sorted[0]
          setFaturaId(defaultFatura.id)
          // Preenche automaticamente o valor restante a pagar
          const restante = defaultFatura.valorTotal - defaultFatura.valorPago
          setValor(restante.toFixed(2))
          // Ajusta o tipo de pagamento baseado no status da fatura inicial
          if (defaultFatura.status === 'ABERTA') {
            setTipoPagamento('ANTECIPADO')
          } else {
            setTipoPagamento('TOTAL')
          }
        } else {
          setFaturaId('')
          setValor('')
        }
      } catch (err) {
        console.error('Erro ao carregar faturas do cartão', err)
      } finally {
        setLoadingFaturas(false)
      }
    }
    loadFaturas()
  }, [cartaoId])

  // Atualiza o valor sugerido e tipo de pagamento ao mudar a fatura selecionada
  const handleFaturaChange = (id: string) => {
    setFaturaId(id)
    const fat = faturas.find(f => f.id === id)
    if (fat) {
      const restante = fat.valorTotal - fat.valorPago
      setValor(restante.toFixed(2))
      // Ajusta o tipo de pagamento padrão baseado no status
      if (fat.status === 'ABERTA') {
        setTipoPagamento('ANTECIPADO')
      } else {
        setTipoPagamento('TOTAL')
      }
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!cartaoId) e.cartaoId = 'O cartão é obrigatório'
    if (!faturaId) e.faturaId = 'A fatura é obrigatória'
    if (!contaOrigemId) e.contaOrigemId = 'Conta origem é obrigatória'
    const v = parseFloat(valor)
    if (valor === '' || isNaN(v) || v <= 0) e.valor = 'Valor deve ser maior que zero'
    if (!tipoPagamento) e.tipoPagamento = 'Tipo de pagamento é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoadingSubmit(true)
    try {
      await onSubmit({
        faturaId: faturaId.trim(),
        contaOrigemId,
        valor: parseFloat(valor),
        tipoPagamento,
      })
    } finally {
      setLoadingSubmit(false)
    }
  }

  const tipoPagamentoLabel: Record<TipoPagamentoFatura, string> = {
    TOTAL: 'Total',
    PARCIAL: 'Parcial',
    ANTECIPADO: 'Antecipado',
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function formatMonthYear(dateString: string) {
    const date = parseLocalDate(dateString)
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
    const formatted = date.toLocaleDateString('pt-BR', options)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-pagamento-fatura-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-pagamento-fatura-title">Pagar Fatura</h2>
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

          {/* Selecionar Cartão */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-cartao">Cartão de Crédito</label>
            <select
              id="pagamento-fatura-cartao"
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
              className={errors.cartaoId ? 'error' : ''}
              disabled={loadingSubmit || loadingData}
            >
              <option value="">Selecione o cartão</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.cartaoId && <p className="form-error">{errors.cartaoId}</p>}
          </div>

          {/* Selecionar Fatura */}
          {cartaoId && (
            <div className="form-group">
              <label htmlFor="pagamento-fatura-id">Fatura a Pagar</label>
              {loadingFaturas ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Buscando faturas...</p>
              ) : faturas.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>
                  Nenhuma fatura em aberto ou fechada pendente para este cartão!
                </p>
              ) : (
                <select
                  id="pagamento-fatura-id"
                  value={faturaId}
                  onChange={(e) => handleFaturaChange(e.target.value)}
                  className={errors.faturaId ? 'error' : ''}
                  disabled={loadingSubmit}
                >
                  {faturas.map((f) => {
                    const restante = f.valorTotal - f.valorPago
                    return (
                      <option key={f.id} value={f.id}>
                        {formatMonthYear(f.mesReferencia)}
                        {' — Resta pagar: '}{formatCurrency(restante)}
                        {' ('}{f.status}{')'}
                      </option>
                    )
                  })}
                </select>
              )}
              {errors.faturaId && <p className="form-error">{errors.faturaId}</p>}
            </div>
          )}

          {/* Conta Origem */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-conta">Conta de Pagamento</label>
            <select
              id="pagamento-fatura-conta"
              value={contaOrigemId}
              onChange={(e) => setContaOrigemId(e.target.value)}
              className={errors.contaOrigemId ? 'error' : ''}
              disabled={loadingSubmit}
            >
              <option value="">Selecione a conta</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.contaOrigemId && <p className="form-error">{errors.contaOrigemId}</p>}
          </div>

          {/* Valor */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-valor">Valor do Pagamento (R$)</label>
            <input
              id="pagamento-fatura-valor"
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

          {/* Tipo de Pagamento */}
          <div className="form-group">
            <label htmlFor="pagamento-fatura-tipo">Tipo de Pagamento</label>
            <select
              id="pagamento-fatura-tipo"
              value={tipoPagamento}
              onChange={(e) => setTipoPagamento(e.target.value as TipoPagamentoFatura)}
              className={errors.tipoPagamento ? 'error' : ''}
              disabled={loadingSubmit}
            >
              {/* Filtra tipos disponíveis baseado no status da fatura */}
              {faturaAtual?.status === 'ABERTA'
                ? <option value="ANTECIPADO">{tipoPagamentoLabel['ANTECIPADO']}</option>
                : (['TOTAL', 'PARCIAL'] as TipoPagamentoFatura[]).map((t) => (
                    <option key={t} value={t}>{tipoPagamentoLabel[t]}</option>
                  ))
              }
            </select>
            {errors.tipoPagamento && <p className="form-error">{errors.tipoPagamento}</p>}
          </div>


          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loadingSubmit}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loadingSubmit || loadingData || !faturaId}>
              {loadingSubmit ? 'Pagando...' : 'Pagar Fatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}