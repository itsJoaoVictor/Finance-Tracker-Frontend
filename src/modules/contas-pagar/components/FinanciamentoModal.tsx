import { useEffect, useState } from 'react'
import { FinanciamentoDetalheResponse } from '../../../types/contasPagar'
import { contaPagarService } from '../../../services/contaPagarService'
import { contaService } from '../../../services/contaService'
import { Building2, PlusCircle } from 'lucide-react'

interface FinanciamentoModalProps {
  modeloId: string
  onClose: () => void
  onUpdated: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export function FinanciamentoModal({
  modeloId,
  onClose,
  onUpdated,
  onToast,
}: FinanciamentoModalProps) {
  const hoje = new Date().toISOString().split('T')[0]
  const [detalhe, setDetalhe] = useState<FinanciamentoDetalheResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAmortForm, setShowAmortForm] = useState(false)

  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje)
  const [origem, setOrigem] = useState<'EXTERNA' | 'CONTA'>('EXTERNA')
  const [contaId, setContaId] = useState('')
  const [modo, setModo] = useState<'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'>('REDUZIR_PRAZO')
  const [parcelasEliminadas, setParcelasEliminadas] = useState('12')
  const [novoValorParcela, setNovoValorParcela] = useState('')
  const [observacao, setObservacao] = useState('Amortização com FGTS')
  const [contas, setContas] = useState<{ id: string; nome: string; saldo: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  const carregar = () => {
    setLoading(true)
    contaPagarService
      .obterFinanciamento(modeloId)
      .then((res) => setDetalhe(res.data))
      .catch(() => onToast('Erro ao carregar financiamento.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
    contaService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setContas(list)
      if (list.length > 0) setContaId(list[0].id)
    })
  }, [modeloId])

  const formatar = (v?: number | null) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const handleAmortizar = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(valor.replace(',', '.'))
    if (isNaN(val) || val <= 0) return onToast('Informe o valor amortizado.', 'error')
    if (origem === 'CONTA' && !contaId) return onToast('Selecione a conta bancária.', 'error')

    setSubmitting(true)
    try {
      const res = await contaPagarService.amortizarFinanciamento(modeloId, {
        valor: val,
        data,
        origem,
        contaId: origem === 'CONTA' ? contaId : null,
        modo,
        parcelasEliminadas:
          modo === 'REDUZIR_PRAZO' ? parseInt(parcelasEliminadas || '0', 10) : null,
        novoValorParcela: novoValorParcela
          ? parseFloat(novoValorParcela.replace(',', '.'))
          : null,
        observacao,
      })
      setDetalhe(res.data)
      setShowAmortForm(false)
      setValor('')
      onToast('Amortização extra registrada com sucesso!', 'success')
      onUpdated()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao registrar amortização.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} />
            {detalhe ? detalhe.modelo.nome : 'Detalhes do Financiamento'}
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading || !detalhe ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Carregando cronograma...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Barra de progresso */}
            {(() => {
              const total = detalhe.parcelasPagas + detalhe.parcelasRestantes
              const pct = total > 0 ? Math.min(100, (detalhe.parcelasPagas / total) * 100) : 0
              return (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(124, 92, 252, 0.08)',
                    border: '1px solid rgba(124, 92, 252, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                    <span>
                      Progresso: <strong>{detalhe.parcelasPagas}</strong> pagas de{' '}
                      <strong>{total}</strong> parcelas ativas
                      {detalhe.parcelasCanceladas > 0 && (
                        <span style={{ color: '#27ae60' }}>
                          {' '}
                          ({detalhe.parcelasCanceladas} eliminadas por amortização)
                        </span>
                      )}
                    </span>
                    <strong>{pct.toFixed(1)}%</strong>
                  </div>
                  <div
                    style={{
                      height: '10px',
                      borderRadius: '999px',
                      background: 'rgba(128,128,128,0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #27ae60, #7c5cfc)',
                      }}
                    />
                  </div>
                </div>
              )
            })()}

            {/* Cards de resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div className="cp-card">
                <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>Pago em Boletos</span>
                <strong style={{ fontSize: '1rem', color: '#27ae60' }}>
                  {formatar(detalhe.totalPagoParcelas)}
                </strong>
              </div>
              <div className="cp-card">
                <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>Amortizações Extras</span>
                <strong style={{ fontSize: '1rem', color: '#7c5cfc' }}>
                  {formatar(detalhe.totalPagoAmortizacoes)}
                </strong>
              </div>
              <div className="cp-card">
                <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>Restante Estimado</span>
                <strong style={{ fontSize: '1rem' }}>{formatar(detalhe.totalRestanteEstimado)}</strong>
              </div>
              <div className="cp-card">
                <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>Parcelas Faltantes</span>
                <strong style={{ fontSize: '1rem' }}>{detalhe.parcelasRestantes} meses</strong>
              </div>
            </div>

            {/* Botão / Formulário de Amortização Extra */}
            <div>
              {!showAmortForm ? (
                <button
                  type="button"
                  className="contas-pagar__btn contas-pagar__btn--primary"
                  onClick={() => setShowAmortForm(true)}
                >
                  <PlusCircle size={16} /> Registrar Amortização Extra (FGTS / Recursos Próprios)
                </button>
              ) : (
                <form
                  onSubmit={handleAmortizar}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--primary, #2f5b4b)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Nova Amortização Extraordinária</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="cp-field">
                      <label>Valor Amortizado (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        required
                      />
                    </div>
                    <div className="cp-field">
                      <label>Data *</label>
                      <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        required
                      />
                    </div>
                    <div className="cp-field">
                      <label>Origem do Recurso *</label>
                      <select
                        value={origem}
                        onChange={(e) => setOrigem(e.target.value as 'EXTERNA' | 'CONTA')}
                      >
                        <option value="EXTERNA">FGTS / Externa (não debita conta)</option>
                        <option value="CONTA">Debitar de Conta Bancária do App</option>
                      </select>
                    </div>
                  </div>

                  {origem === 'CONTA' && (
                    <div className="cp-field">
                      <label>Conta Bancária *</label>
                      <select value={contaId} onChange={(e) => setContaId(e.target.value)} required>
                        {contas.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} ({formatar(c.saldo)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="cp-field">
                      <label>Modalidade no Banco *</label>
                      <select
                        value={modo}
                        onChange={(e) =>
                          setModo(e.target.value as 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA')
                        }
                      >
                        <option value="REDUZIR_PRAZO">Reduzir Prazo (eliminar parcelas finais)</option>
                        <option value="REDUZIR_PARCELA">Reduzir Valor da Parcela</option>
                      </select>
                    </div>

                    {modo === 'REDUZIR_PRAZO' && (
                      <div className="cp-field">
                        <label>Qtd. Parcelas Eliminadas *</label>
                        <input
                          type="number"
                          min={1}
                          max={detalhe.parcelasRestantes}
                          value={parcelasEliminadas}
                          onChange={(e) => setParcelasEliminadas(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="cp-field">
                      <label>
                        Novo Valor Estimado da Parcela {modo === 'REDUZIR_PARCELA' ? '*' : '(opcional)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 2150.00"
                        value={novoValorParcela}
                        onChange={(e) => setNovoValorParcela(e.target.value)}
                        required={modo === 'REDUZIR_PARCELA'}
                      />
                    </div>
                  </div>

                  <div className="cp-field">
                    <label>Observação</label>
                    <input
                      type="text"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="contas-pagar__btn"
                      onClick={() => setShowAmortForm(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="contas-pagar__btn contas-pagar__btn--primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Processando...' : 'Confirmar Amortização'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Histórico de Amortizações */}
            {detalhe.amortizacoes.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Histórico de Amortizações Extras</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detalhe.amortizacoes.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(128,128,128,0.08)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div>
                        <strong>{formatar(a.valor)}</strong> em {a.data} · {a.contaNome}
                        {a.observacao ? ` — ${a.observacao}` : ''}
                      </div>
                      <div style={{ opacity: 0.8 }}>
                        {a.modo === 'REDUZIR_PRAZO'
                          ? `-${a.parcelasEliminadas} parcelas`
                          : `Nova parcela: ${formatar(a.novoValorParcela)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
