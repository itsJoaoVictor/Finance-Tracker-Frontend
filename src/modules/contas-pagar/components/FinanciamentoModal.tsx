import { useEffect, useMemo, useState } from 'react'
import { DirecaoAbatimento, FinanciamentoDetalheResponse } from '../../../types/contasPagar'
import { contaPagarService } from '../../../services/contaPagarService'
import { contaService } from '../../../services/contaService'
import { Building2, PlusCircle, CalendarClock, CheckCircle2, Sparkles } from 'lucide-react'

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
  const [painelAtivo, setPainelAtivo] = useState<'NONE' | 'AMORTIZAR' | 'PRAZO'>('NONE')

  // Estado: Amortização Extra
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje)
  const [origem, setOrigem] = useState<'EXTERNA' | 'CONTA'>('EXTERNA')
  const [contaId, setContaId] = useState('')
  const [modo, setModo] = useState<'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'>('REDUZIR_PRAZO')
  const [direcaoAbatimento, setDirecaoAbatimento] = useState<DirecaoAbatimento>('ULTIMAS')
  const [parcelasEliminadas, setParcelasEliminadas] = useState('1')
  const [novoValorParcela, setNovoValorParcela] = useState('')
  const [novoValorUltimaParcela, setNovoValorUltimaParcela] = useState('')
  const [descontoManual, setDescontoManual] = useState('')
  const [observacao, setObservacao] = useState('Amortização com desconto')

  // Estado: Encerrar / Ajustar Prazo (sem pagamento extra)
  const [acaoPrazo, setAcaoPrazo] = useState<'ENCERRAR' | 'REDUZIR' | 'ESTENDER'>('ENCERRAR')
  const [qtdPrazo, setQtdPrazo] = useState('2')
  const [valorAdicionalPrazo, setValorAdicionalPrazo] = useState('')
  const [motivoPrazo, setMotivoPrazo] = useState('')

  const [contas, setContas] = useState<{ id: string; nome: string; saldo: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  const carregar = () => {
    setLoading(true)
    contaPagarService
      .obterFinanciamento(modeloId)
      .then((res) => {
        setDetalhe(res.data)
        const abertas = res.data.parcelasRestantes
        if (abertas > 0) {
          setParcelasEliminadas(String(Math.min(12, abertas)))
        } else {
          setAcaoPrazo('ESTENDER')
        }
      })
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

  const parcelasAbertas = useMemo(() => {
    if (!detalhe) return []
    return detalhe.ocorrencias.filter(
      (o) => o.status === 'PENDENTE' || o.status === 'AGUARDANDO_VALOR',
    )
  }, [detalhe])

  // Prévia ao vivo da amortização (parcelas alvo, soma original e economia estimada)
  const previaAmortizacao = useMemo(() => {
    if (!detalhe || parcelasAbertas.length === 0) return null
    const valorPagoNum = parseFloat(valor.replace(',', '.'))
    const temValorPago = isFinite(valorPagoNum) && valorPagoNum > 0

    if (modo === 'REDUZIR_PRAZO') {
      const qtd = Math.max(0, Math.min(parcelasAbertas.length, parseInt(parcelasEliminadas || '0', 10) || 0))
      if (qtd <= 0) return null
      const alvos =
        direcaoAbatimento === 'PROXIMAS'
          ? parcelasAbertas.slice(0, qtd)
          : parcelasAbertas.slice(parcelasAbertas.length - qtd)
      const valorOriginal = alvos.reduce((acc, o) => acc + (o.valorEfetivo || 0), 0)
      const economiaAuto = temValorPago ? Math.max(0, valorOriginal - valorPagoNum) : null
      const pctDesconto =
        economiaAuto != null && valorOriginal > 0 ? (economiaAuto / valorOriginal) * 100 : null
      const primeiraAlvo = alvos[0]
      const ultimaAlvo = alvos[alvos.length - 1]
      return {
        qtd,
        valorOriginal,
        economiaAuto,
        pctDesconto,
        faixaParcelas:
          primeiraAlvo?.numeroParcela && ultimaAlvo?.numeroParcela
            ? primeiraAlvo.numeroParcela === ultimaAlvo.numeroParcela
              ? `Parcela ${primeiraAlvo.numeroParcela}`
              : `Parcelas ${primeiraAlvo.numeroParcela} até ${ultimaAlvo.numeroParcela}`
            : `${qtd} parcela(s)`,
        restantesDepois: parcelasAbertas.length - qtd,
      }
    }

    // REDUZIR_PARCELA
    const novoVal = parseFloat(novoValorParcela.replace(',', '.'))
    if (!isFinite(novoVal) || novoVal <= 0) return null
    const restanteAntes = parcelasAbertas.reduce((acc, o) => acc + (o.valorEfetivo || 0), 0)
    const novoUlt = parseFloat(novoValorUltimaParcela.replace(',', '.'))
    const restanteDepois =
      detalhe.modelo.modoParcelamento === 'PROGRESSIVO' && isFinite(novoUlt) && novoUlt > 0
        ? ((novoVal + novoUlt) / 2) * parcelasAbertas.length
        : novoVal * parcelasAbertas.length
    const valorOriginal = Math.max(0, restanteAntes - restanteDepois)
    const economiaAuto = temValorPago ? Math.max(0, valorOriginal - valorPagoNum) : null
    const pctDesconto =
      economiaAuto != null && valorOriginal > 0 ? (economiaAuto / valorOriginal) * 100 : null

    return {
      qtd: 0,
      valorOriginal,
      economiaAuto,
      pctDesconto,
      faixaParcelas: `${parcelasAbertas.length} parcelas reajustadas`,
      restantesDepois: parcelasAbertas.length,
    }
  }, [
    detalhe,
    parcelasAbertas,
    valor,
    modo,
    direcaoAbatimento,
    parcelasEliminadas,
    novoValorParcela,
    novoValorUltimaParcela,
  ])

  const handleAmortizar = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(valor.replace(',', '.'))
    if (isNaN(val) || val <= 0) return onToast('Informe o valor pago na amortização.', 'error')
    if (origem === 'CONTA' && !contaId) return onToast('Selecione a conta bancária.', 'error')

    const descNum = descontoManual.trim() ? parseFloat(descontoManual.replace(',', '.')) : null
    if (descNum != null && (isNaN(descNum) || descNum < 0)) {
      return onToast('Desconto obtido deve ser zero ou positivo.', 'error')
    }

    setSubmitting(true)
    try {
      const res = await contaPagarService.amortizarFinanciamento(modeloId, {
        valor: val,
        data,
        origem,
        contaId: origem === 'CONTA' ? contaId : null,
        modo,
        direcaoAbatimento: modo === 'REDUZIR_PRAZO' ? direcaoAbatimento : 'ULTIMAS',
        parcelasEliminadas:
          modo === 'REDUZIR_PRAZO' ? parseInt(parcelasEliminadas || '0', 10) : null,
        novoValorParcela: novoValorParcela
          ? parseFloat(novoValorParcela.replace(',', '.'))
          : null,
        novoValorUltimaParcela: novoValorUltimaParcela
          ? parseFloat(novoValorUltimaParcela.replace(',', '.'))
          : null,
        descontoObtido: descNum,
        observacao,
      })
      setDetalhe(res.data)
      setPainelAtivo('NONE')
      setValor('')
      setDescontoManual('')
      setNovoValorParcela('')
      setNovoValorUltimaParcela('')
      onToast('Amortização extra registrada com sucesso!', 'success')
      onUpdated()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao registrar amortização.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAjustarPrazo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detalhe) return

    if (acaoPrazo === 'ENCERRAR') {
      const ok = window.confirm(
        `Encerrar "${detalhe.modelo.nome}" agora? As ${detalhe.parcelasRestantes} parcela(s) futura(s) em aberto serão canceladas e todo o histórico pago será preservado como Concluído.`,
      )
      if (!ok) return
    }

    const qtdNum = parseInt(qtdPrazo || '0', 10)
    if ((acaoPrazo === 'REDUZIR' || acaoPrazo === 'ESTENDER') && (isNaN(qtdNum) || qtdNum <= 0)) {
      return onToast('Informe uma quantidade válida de parcelas.', 'error')
    }

    const valAdd = valorAdicionalPrazo.trim()
      ? parseFloat(valorAdicionalPrazo.replace(',', '.'))
      : null

    setSubmitting(true)
    try {
      const res = await contaPagarService.ajustarPrazo(modeloId, {
        acao: acaoPrazo,
        quantidadeParcelas: acaoPrazo === 'ENCERRAR' ? null : qtdNum,
        valorParcelasAdicionadas: acaoPrazo === 'ESTENDER' ? valAdd : null,
        motivo: motivoPrazo.trim() || null,
      })
      setDetalhe(res.data)
      setPainelAtivo('NONE')
      setMotivoPrazo('')
      setValorAdicionalPrazo('')
      onToast(
        acaoPrazo === 'ENCERRAR'
          ? 'Contrato encerrado antecipadamente! Histórico preservado.'
          : acaoPrazo === 'REDUZIR'
          ? 'Prazo reduzido com sucesso!'
          : 'Prazo estendido com sucesso!',
        'success',
      )
      onUpdated()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao ajustar prazo.', 'error')
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
      <div className="modal" style={{ maxWidth: '760px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Building2 size={20} />
            <span>{detalhe ? detalhe.modelo.nome : 'Detalhes do Financiamento'}</span>
            {detalhe?.concluido && (
              <span className="cp-parcel-badge cp-parcel-badge--down" style={{ fontSize: '0.76rem' }}>
                <CheckCircle2 size={13} /> Concluído / Quitado
              </span>
            )}
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading || !detalhe ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Carregando cronograma...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Barra de progresso */}
            {(() => {
              const total = detalhe.parcelasPagas + detalhe.parcelasRestantes
              const pct = detalhe.concluido
                ? 100
                : total > 0
                ? Math.min(100, (detalhe.parcelasPagas / total) * 100)
                : 0
              return (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: detalhe.concluido
                      ? 'rgba(22, 163, 74, 0.1)'
                      : 'rgba(124, 92, 252, 0.08)',
                    border: detalhe.concluido
                      ? '1px solid rgba(22, 163, 74, 0.35)'
                      : '1px solid rgba(124, 92, 252, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', gap: '8px', flexWrap: 'wrap' }}>
                    <span>
                      Progresso: <strong>{detalhe.parcelasPagas}</strong> pagas de{' '}
                      <strong>{total}</strong> parcelas ativas
                      {detalhe.parcelasCanceladas > 0 && (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          {' '}
                          ({detalhe.parcelasCanceladas} eliminadas/encerradas)
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
                        background: detalhe.concluido
                          ? '#16a34a'
                          : 'linear-gradient(90deg, #27ae60, #7c5cfc)',
                      }}
                    />
                  </div>
                </div>
              )
            })()}

            {/* Cards de resumo */}
            <div className="cp-fin-kpis">
              <div className="cp-fin-kpi">
                <span className="cp-fin-kpi__label">Valor Total</span>
                <span className="cp-fin-kpi__value">
                  {formatar((detalhe.totalGeralPago || 0) + (detalhe.totalRestanteEstimado || 0))}
                </span>
              </div>
              <div className="cp-fin-kpi">
                <span className="cp-fin-kpi__label">Total Pago</span>
                <span className="cp-fin-kpi__value cp-fin-kpi__value--paid">
                  {formatar(detalhe.totalGeralPago)}
                </span>
              </div>
              <div className="cp-fin-kpi">
                <span className="cp-fin-kpi__label">Valor Restante</span>
                <span className="cp-fin-kpi__value cp-fin-kpi__value--rest">
                  {formatar(detalhe.totalRestanteEstimado)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div className="cp-card" style={{ padding: '12px 14px', gap: '4px' }}>
                <span style={{ fontSize: '0.73rem', opacity: 0.7 }}>Pago em Boletos</span>
                <strong style={{ fontSize: '0.98rem', color: '#16a34a' }}>
                  {formatar(detalhe.totalPagoParcelas)}
                </strong>
              </div>
              <div className="cp-card" style={{ padding: '12px 14px', gap: '4px' }}>
                <span style={{ fontSize: '0.73rem', opacity: 0.7 }}>Amortizações Extras</span>
                <strong style={{ fontSize: '0.98rem', color: '#7c5cfc' }}>
                  {formatar(detalhe.totalPagoAmortizacoes)}
                </strong>
              </div>
              <div className="cp-card" style={{ padding: '12px 14px', gap: '4px' }}>
                <span style={{ fontSize: '0.73rem', opacity: 0.7 }}>Desconto / Economia</span>
                <strong style={{ fontSize: '0.98rem', color: '#15803d' }}>
                  {formatar(detalhe.totalDescontoObtido)}
                </strong>
              </div>
              <div className="cp-card" style={{ padding: '12px 14px', gap: '4px' }}>
                <span style={{ fontSize: '0.73rem', opacity: 0.7 }}>Parcelas Faltantes</span>
                <strong style={{ fontSize: '0.98rem' }}>
                  {detalhe.concluido ? 'Concluído ✓' : `${detalhe.parcelasRestantes} parc.`}
                </strong>
              </div>
            </div>

            {/* Botões de ação */}
            {painelAtivo === 'NONE' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {!detalhe.concluido && (
                  <button
                    type="button"
                    className="contas-pagar__btn contas-pagar__btn--primary"
                    onClick={() => setPainelAtivo('AMORTIZAR')}
                  >
                    <PlusCircle size={16} /> Registrar Amortização Extra (com Desconto)
                  </button>
                )}
                <button
                  type="button"
                  className="contas-pagar__btn"
                  onClick={() => {
                    setAcaoPrazo(detalhe.concluido ? 'ESTENDER' : 'ENCERRAR')
                    setPainelAtivo('PRAZO')
                  }}
                >
                  <CalendarClock size={16} />{' '}
                  {detalhe.concluido ? 'Estender Prazo (+Parcelas)' : 'Encerrar Antes / Ajustar Prazo'}
                </button>
              </div>
            )}

            {/* Formulário 1: Amortização Extra com Desconto */}
            {painelAtivo === 'AMORTIZAR' && (
              <form
                onSubmit={handleAmortizar}
                className="cp-parcel-panel"
                style={{ gap: '12px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Nova Amortização Extraordinária
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="cp-field">
                    <label>Valor Pago na Amortização (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 2500.00"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="cp-field">
                    <label>Efeito no Contrato *</label>
                    <select
                      value={modo}
                      onChange={(e) =>
                        setModo(e.target.value as 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA')
                      }
                    >
                      <option value="REDUZIR_PRAZO">Reduzir Prazo (abater parcelas)</option>
                      <option value="REDUZIR_PARCELA">Reduzir Valor da Parcela</option>
                    </select>
                  </div>

                  {modo === 'REDUZIR_PRAZO' && (
                    <div className="cp-field">
                      <label>Quais parcelas foram abatidas?</label>
                      <select
                        value={direcaoAbatimento}
                        onChange={(e) => setDirecaoAbatimento(e.target.value as DirecaoAbatimento)}
                      >
                        <option value="ULTIMAS">Últimas parcelas (padrão — maior desconto)</option>
                        <option value="PROXIMAS">Próximas parcelas (antecipação imediata)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {modo === 'REDUZIR_PRAZO' && (
                    <div className="cp-field">
                      <label>Qtd. Parcelas Abatidas *</label>
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
                      Desconto / Economia Obtida (R$){' '}
                      <span style={{ opacity: 0.7, fontWeight: 500 }}>(vazio = automático)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder={
                        previaAmortizacao?.economiaAuto != null
                          ? `Auto: ${previaAmortizacao.economiaAuto.toFixed(2)}`
                          : 'Calculado automaticamente'
                      }
                      value={descontoManual}
                      onChange={(e) => setDescontoManual(e.target.value)}
                    />
                  </div>

                  <div className="cp-field">
                    <label>
                      Novo Valor da Parcela {modo === 'REDUZIR_PARCELA' ? '*' : '(opcional)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Deixe vazio para manter atual"
                      value={novoValorParcela}
                      onChange={(e) => setNovoValorParcela(e.target.value)}
                      required={modo === 'REDUZIR_PARCELA'}
                    />
                  </div>

                  {detalhe.modelo.modoParcelamento === 'PROGRESSIVO' && novoValorParcela.trim() !== '' && (
                    <div className="cp-field">
                      <label>Nova Última Parcela (opcional)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 620.00"
                        value={novoValorUltimaParcela}
                        onChange={(e) => setNovoValorUltimaParcela(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Prévia ao vivo da economia */}
                {previaAmortizacao && (
                  <div className="cp-parcel-summary">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} />
                        <span>
                          {previaAmortizacao.faixaParcelas} · Valor original estimado:{' '}
                          {formatar(previaAmortizacao.valorOriginal)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', opacity: 0.8 }}>
                        Restarão {previaAmortizacao.restantesDepois} parcela(s) em aberto
                        {previaAmortizacao.restantesDepois === 0 ? ' (contrato será quitado!)' : ''}.
                      </div>
                    </div>

                    {previaAmortizacao.economiaAuto != null && (
                      <div className="cp-parcel-badge cp-parcel-badge--down" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                        Economia estimada: {formatar(previaAmortizacao.economiaAuto)}
                        {previaAmortizacao.pctDesconto != null && previaAmortizacao.pctDesconto > 0
                          ? ` (${previaAmortizacao.pctDesconto.toFixed(1)}% off)`
                          : ''}
                      </div>
                    )}
                  </div>
                )}

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
                    onClick={() => setPainelAtivo('NONE')}
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

            {/* Formulário 2: Encerrar Antecipadamente / Ajustar Prazo (sem pagamento extra) */}
            {painelAtivo === 'PRAZO' && (
              <form
                onSubmit={handleAjustarPrazo}
                className="cp-parcel-panel"
                style={{ gap: '12px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Encerrar Antecipadamente ou Ajustar Prazo (sem pagamento extra)
                </div>

                <div className="cp-mode-grid">
                  {!detalhe.concluido && (
                    <button
                      type="button"
                      className={`cp-type-card ${acaoPrazo === 'ENCERRAR' ? 'cp-type-card--active' : ''}`}
                      onClick={() => setAcaoPrazo('ENCERRAR')}
                    >
                      <div className="cp-type-card__title">Encerrar agora</div>
                      <div className="cp-type-card__sub">
                        Cancela as {detalhe.parcelasRestantes} restantes e conclui
                      </div>
                    </button>
                  )}

                  {!detalhe.concluido && (
                    <button
                      type="button"
                      className={`cp-type-card ${acaoPrazo === 'REDUZIR' ? 'cp-type-card--active' : ''}`}
                      onClick={() => setAcaoPrazo('REDUZIR')}
                    >
                      <div className="cp-type-card__title">Reduzir prazo (-N)</div>
                      <div className="cp-type-card__sub">Obra adiantou — remover últimas</div>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`cp-type-card ${acaoPrazo === 'ESTENDER' ? 'cp-type-card--active' : ''}`}
                    onClick={() => setAcaoPrazo('ESTENDER')}
                  >
                    <div className="cp-type-card__title">Estender prazo (+N)</div>
                    <div className="cp-type-card__sub">Obra atrasou — adicionar ao final</div>
                  </button>
                </div>

                {(acaoPrazo === 'REDUZIR' || acaoPrazo === 'ESTENDER') && (
                  <div style={{ display: 'grid', gridTemplateColumns: acaoPrazo === 'ESTENDER' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                    <div className="cp-field">
                      <label>
                        {acaoPrazo === 'REDUZIR'
                          ? `Quantas parcelas finais remover? (máx ${detalhe.parcelasRestantes}) *`
                          : 'Quantas parcelas adicionar ao final? *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={acaoPrazo === 'REDUZIR' ? detalhe.parcelasRestantes : 120}
                        value={qtdPrazo}
                        onChange={(e) => setQtdPrazo(e.target.value)}
                        required
                      />
                    </div>

                    {acaoPrazo === 'ESTENDER' && (
                      <div className="cp-field">
                        <label>Valor estimado das novas parcelas (opcional)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Vazio = repete última parcela"
                          value={valorAdicionalPrazo}
                          onChange={(e) => setValorAdicionalPrazo(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="cp-field">
                  <label>Motivo / Observação (opcional)</label>
                  <input
                    type="text"
                    placeholder={
                      acaoPrazo === 'ENCERRAR'
                        ? 'Ex: Obra concluída e chaves entregues antes do prazo'
                        : acaoPrazo === 'REDUZIR'
                        ? 'Ex: Cronograma da obra adiantou 3 meses'
                        : 'Ex: Atraso na entrega das chaves'
                    }
                    value={motivoPrazo}
                    onChange={(e) => setMotivoPrazo(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="contas-pagar__btn"
                    onClick={() => setPainelAtivo('NONE')}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="contas-pagar__btn contas-pagar__btn--primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Salvando...'
                      : acaoPrazo === 'ENCERRAR'
                      ? 'Encerrar Contrato Agora'
                      : acaoPrazo === 'REDUZIR'
                      ? 'Reduzir Prazo'
                      : 'Estender Prazo'}
                  </button>
                </div>
              </form>
            )}

            {/* Histórico de Amortizações */}
            {detalhe.amortizacoes.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Histórico de Amortizações Extras</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detalhe.amortizacoes.map((a) => {
                    const pct =
                      a.descontoObtido != null &&
                      a.descontoObtido > 0 &&
                      a.valorOriginalAbatido != null &&
                      a.valorOriginalAbatido > 0
                        ? (a.descontoObtido / a.valorOriginalAbatido) * 100
                        : null
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'var(--surface-subtle, rgba(128,128,128,0.08))',
                          border: '1px solid var(--border-subtle, rgba(15, 23, 42, 0.08))',
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>
                          <div>
                            <strong>{formatar(a.valor)}</strong> em {a.data} · {a.contaNome}
                            {a.observacao ? ` — ${a.observacao}` : ''}
                          </div>
                          {a.valorOriginalAbatido != null && a.valorOriginalAbatido > 0 && (
                            <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '2px' }}>
                              Valor abatido: {formatar(a.valorOriginalAbatido)}
                              {a.modo === 'REDUZIR_PRAZO' && a.direcaoAbatimento
                                ? ` (${a.direcaoAbatimento === 'PROXIMAS' ? 'próximas' : 'últimas'} parcelas)`
                                : ''}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ opacity: 0.85, fontWeight: 600 }}>
                            {a.modo === 'REDUZIR_PRAZO'
                              ? `-${a.parcelasEliminadas} parc.`
                              : `Nova parcela: ${formatar(a.novoValorParcela)}`}
                          </span>
                          {a.descontoObtido != null && a.descontoObtido > 0 && (
                            <span className="cp-parcel-badge cp-parcel-badge--down">
                              Economia: {formatar(a.descontoObtido)}
                              {pct != null ? ` (${pct.toFixed(0)}%)` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
