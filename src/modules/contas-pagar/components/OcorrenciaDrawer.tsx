import { useEffect, useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { ContaPagarOcorrencia } from '../../../types/contasPagar'
import { contaService } from '../../../services/contaService'
import { cartaoService } from '../../../services/cartaoService'
import { contaPagarService } from '../../../services/contaPagarService'
import { transacaoService } from '../../../services/transacaoService'
import { iaService } from '../../../services/iaService'
import {
  Copy,
  Check,
  CheckCircle2,
  RotateCcw,
  Ban,
  ImagePlus,
  Sparkles,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react'

function compressImageToBase64(file: File, maxDimension = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Falha ao decodificar a imagem selecionada.'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'))
    reader.readAsDataURL(file)
  })
}

interface OcorrenciaDrawerProps {
  ocorrencia: ContaPagarOcorrencia
  onClose: () => void
  onUpdated: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export function OcorrenciaDrawer({
  ocorrencia,
  onClose,
  onUpdated,
  onToast,
}: OcorrenciaDrawerProps) {
  const hoje = new Date().toISOString().split('T')[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [valorReal, setValorReal] = useState(
    ocorrencia.valorReal != null
      ? String(ocorrencia.valorReal)
      : ocorrencia.valorEstimado != null
      ? String(ocorrencia.valorEstimado)
      : '',
  )
  const [dataVencimento, setDataVencimento] = useState(ocorrencia.dataVencimento)
  const [linhaDigitavel, setLinhaDigitavel] = useState(ocorrencia.linhaDigitavel || '')
  const [observacao, setObservacao] = useState(ocorrencia.observacao || '')
  const [copied, setCopied] = useState(false)

  // Pagamento
  const [meio, setMeio] = useState<'CONTA' | 'CARTAO'>('CONTA')
  const [contaId, setContaId] = useState(ocorrencia.contaPadraoId || '')
  const [cartaoId, setCartaoId] = useState('')
  const [dataPagamento, setDataPagamento] = useState(hoje)
  const [valorPago, setValorPago] = useState(
    ocorrencia.valorReal != null
      ? String(ocorrencia.valorReal)
      : ocorrencia.valorEstimado != null
      ? String(ocorrencia.valorEstimado)
      : '',
  )

  const [contas, setContas] = useState<{ id: string; nome: string; saldo: number }[]>([])
  const [cartoes, setCartoes] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(false)

  // Estados de leitura de Fatura / Boleto / Comprovante via IA
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [extractingReceipt, setExtractingReceipt] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [receiptSuccessInfo, setReceiptSuccessInfo] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    contaService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setContas(list)
      if (!contaId && list.length > 0) setContaId(list[0].id)
    })
    cartaoService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setCartoes(list)
      if (list.length > 0) setCartaoId(list[0].id)
    })
  }, [])

  const processReceiptFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setReceiptError('Selecione um arquivo de imagem válido (PNG, JPG, WEBP).')
      return
    }

    setReceiptError(null)
    setReceiptSuccessInfo(null)
    setExtractingReceipt(true)

    try {
      const base64DataUri = await compressImageToBase64(file)
      setReceiptPreview(base64DataUri)

      const res = await iaService.extrairBoleto(base64DataUri)
      const ext = res.data

      if (ext) {
        if (ext.valor != null && !isNaN(Number(ext.valor)) && Number(ext.valor) > 0) {
          const valFormatted = Number(ext.valor).toFixed(2)
          setValorReal(valFormatted)
          setValorPago(valFormatted)
        }

        if (ext.dataVencimento && /^\d{4}-\d{2}-\d{2}$/.test(ext.dataVencimento)) {
          setDataVencimento(ext.dataVencimento)
        }

        if (ext.linhaDigitavel && ext.linhaDigitavel.trim()) {
          setLinhaDigitavel(ext.linhaDigitavel.trim())
        }

        if (ext.observacao && ext.observacao.trim()) {
          setObservacao(ext.observacao.trim())
        }

        if (ext.jaPago) {
          if (ext.dataPagamento && /^\d{4}-\d{2}-\d{2}$/.test(ext.dataPagamento)) {
            setDataPagamento(ext.dataPagamento)
          }
          if (ext.contaBancariaId) {
            setMeio('CONTA')
            setContaId(ext.contaBancariaId)
          } else if (ext.contaBancariaSugerida) {
            const matchConta = contas.find(
              (c) =>
                c.nome.toLowerCase() === ext.contaBancariaSugerida!.trim().toLowerCase() ||
                c.nome.toLowerCase().includes(ext.contaBancariaSugerida!.trim().toLowerCase())
            )
            if (matchConta) {
              setMeio('CONTA')
              setContaId(matchConta.id)
            }
          }
        }

        setReceiptSuccessInfo(
          ext.jaPago
            ? 'Comprovante de pagamento identificado! Confira os dados na Seção 2 para dar baixa.'
            : ext.justificativa || 'Fatura/Boleto lido com sucesso! Confira o valor e a linha digitável.'
        )
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setReceiptError(
        axiosErr?.response?.data?.error ||
          'Não foi possível ler a imagem da fatura/boleto. Preencha manualmente.'
      )
    } finally {
      setExtractingReceipt(false)
    }
  }, [contas])

  useEffect(() => {
    if (ocorrencia.status === 'PAGA') return

    function handlePaste(e: ClipboardEvent) {
      if (extractingReceipt || loading) return
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            e.preventDefault()
            processReceiptFile(file)
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [ocorrencia.status, extractingReceipt, loading, processReceiptFile])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processReceiptFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    if (extractingReceipt || loading) return
    const file = e.dataTransfer.files?.[0]
    if (file) processReceiptFile(file)
  }

  function handleClearReceipt() {
    setReceiptPreview(null)
    setReceiptError(null)
    setReceiptSuccessInfo(null)
  }

  const formatarMoeda = (v?: number | null) =>
    v == null
      ? '—'
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handleCopyLinha = () => {
    if (!linhaDigitavel) return
    navigator.clipboard.writeText(linhaDigitavel)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmarDados = async () => {
    setLoading(true)
    try {
      const val = valorReal ? parseFloat(valorReal.replace(',', '.')) : null
      await contaPagarService.atualizarOcorrencia(ocorrencia.id, {
        valorReal: val && val > 0 ? val : null,
        dataVencimento,
        linhaDigitavel,
        observacao,
      })
      if (val && val > 0) setValorPago(String(val))
      onToast('Dados da ocorrência atualizados com sucesso!', 'success')
      onUpdated()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao atualizar ocorrência.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(valorPago.replace(',', '.'))
    if (isNaN(val) || val <= 0) return onToast('Informe o valor pago.', 'error')
    if (meio === 'CONTA' && !contaId) return onToast('Selecione a conta bancária.', 'error')
    if (meio === 'CARTAO' && !cartaoId) return onToast('Selecione o cartão de crédito.', 'error')

    setLoading(true)
    try {
      await contaPagarService.pagarOcorrencia(ocorrencia.id, {
        meio,
        contaId: meio === 'CONTA' ? contaId : null,
        cartaoId: meio === 'CARTAO' ? cartaoId : null,
        dataPagamento,
        valorPago: val,
        linhaDigitavel,
        observacao,
      })
      onToast('Conta marcada como PAGA e transação registrada!', 'success')
      onUpdated()
      onClose()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao registrar pagamento.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEstornar = async () => {
    if (!ocorrencia.transacaoId) return
    setLoading(true)
    try {
      await transacaoService.estornar(ocorrencia.transacaoId, { transacaoId: ocorrencia.transacaoId })
      onToast('Pagamento estornado! A conta voltou para PENDENTE.', 'success')
      onUpdated()
      onClose()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao estornar pagamento.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCancelamento = async (cancelar: boolean) => {
    setLoading(true)
    try {
      await contaPagarService.cancelarOcorrencia(ocorrencia.id, cancelar)
      onToast(cancelar ? 'Ocorrência cancelada neste mês.' : 'Ocorrência reativada.', 'success')
      onUpdated()
      onClose()
    } catch (err: any) {
      onToast(err.response?.data?.error || 'Erro ao alterar status.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const statusColor: Record<string, string> = {
    PAGA: '#27ae60',
    PENDENTE: '#d68910',
    AGUARDANDO_VALOR: '#7f8c8d',
    ATRASADA: '#e74c3c',
    CANCELADA: '#555',
  }

  return (
    <div
      className="cp-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="cp-drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 9px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: `${statusColor[ocorrencia.statusEfetivo]}22`,
                color: statusColor[ocorrencia.statusEfetivo],
                marginBottom: '6px',
              }}
            >
              {ocorrencia.statusEfetivo}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
              {ocorrencia.modeloNome}
              {ocorrencia.numeroParcela && ocorrencia.totalParcelas && (
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  {' '}
                  ({ocorrencia.numeroParcela}/{ocorrencia.totalParcelas})
                </span>
              )}
            </h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Competência: {ocorrencia.mesReferencia.substring(0, 7)}
              {ocorrencia.agrupador ? ` · ${ocorrencia.agrupador}` : ''} · {ocorrencia.categoriaNome}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {ocorrencia.status === 'PAGA' ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(39, 174, 96, 0.12)',
              border: '1px solid rgba(39, 174, 96, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#27ae60', fontWeight: 700 }}>
              <CheckCircle2 size={18} /> Conta Paga
            </div>
            <div style={{ fontSize: '0.88rem' }}>
              Valor pago: <strong>{formatarMoeda(ocorrencia.valorPago)}</strong> em{' '}
              <strong>{ocorrencia.dataPagamento}</strong>
            </div>
            {ocorrencia.jurosMulta > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#e67e22' }}>
                Juros/Multa registrados: {formatarMoeda(ocorrencia.jurosMulta)} (valor original:{' '}
                {formatarMoeda(ocorrencia.valorReal)})
              </div>
            )}
            {ocorrencia.linhaDigitavel && (
              <div style={{ fontSize: '0.78rem', opacity: 0.75, wordBreak: 'break-all' }}>
                Linha digitável: {ocorrencia.linhaDigitavel}
              </div>
            )}
            {ocorrencia.observacao && (
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Obs: {ocorrencia.observacao}</div>
            )}
            {ocorrencia.transacaoId && (
              <button
                type="button"
                className="contas-pagar__btn contas-pagar__btn--danger"
                onClick={handleEstornar}
                disabled={loading}
                style={{ marginTop: '8px', alignSelf: 'flex-start' }}
              >
                <RotateCcw size={15} /> Estornar Pagamento (Reabrir Conta)
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Captura de Fatura / Boleto / Comprovante via IA */}
            <div className="receipt-ai-box">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={extractingReceipt || loading}
              />

              <div
                className={`receipt-ai-dropzone ${isDraggingOver ? 'receipt-ai-dropzone--drag' : ''} ${
                  extractingReceipt ? 'receipt-ai-dropzone--loading' : ''
                } ${receiptSuccessInfo ? 'receipt-ai-dropzone--success' : ''}`}
                onClick={() => {
                  if (!extractingReceipt && !loading) {
                    fileInputRef.current?.click()
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!extractingReceipt && !loading) setIsDraggingOver(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDraggingOver(false)
                }}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !extractingReceipt && !loading) {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
              >
                {receiptPreview ? (
                  <div className="receipt-ai-preview">
                    <img
                      src={receiptPreview}
                      alt="Fatura ou boleto enviado"
                      className="receipt-ai-preview__img"
                    />
                    <div className="receipt-ai-preview__info">
                      {extractingReceipt ? (
                        <>
                          <div className="receipt-ai-preview__badge receipt-ai-preview__badge--loading">
                            <Loader2 size={14} className="receipt-ai-spin" />
                            <span>Lendo fatura / boleto com IA...</span>
                          </div>
                          <p className="receipt-ai-preview__sub">
                            Extraindo valor real, vencimento, linha digitável e dados de pagamento
                          </p>
                        </>
                      ) : receiptError ? (
                        <>
                          <div className="receipt-ai-preview__badge receipt-ai-preview__badge--error">
                            <AlertCircle size={14} />
                            <span>Falha na leitura</span>
                          </div>
                          <p className="receipt-ai-preview__sub receipt-ai-preview__sub--error">
                            {receiptError}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="receipt-ai-preview__badge receipt-ai-preview__badge--ok">
                            <CheckCircle2 size={14} />
                            <span>Preenchido via Leitura IA</span>
                          </div>
                          <p className="receipt-ai-preview__sub">
                            {receiptSuccessInfo || 'Confira os dados abaixo antes de confirmar.'}
                          </p>
                        </>
                      )}
                    </div>
                    {!extractingReceipt && (
                      <button
                        type="button"
                        className="receipt-ai-preview__remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClearReceipt()
                        }}
                        title="Remover imagem"
                        aria-label="Remover imagem"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="receipt-ai-empty">
                    <div className="receipt-ai-empty__icon">
                      <ImagePlus size={20} />
                    </div>
                    <div className="receipt-ai-empty__text">
                      <div className="receipt-ai-empty__title">
                        <span>Enviar conta / boleto ou comprovante</span>
                        <span className="receipt-ai-empty__pill">
                          <Sparkles size={11} />
                          Auto-preencher IA
                        </span>
                      </div>
                      <p className="receipt-ai-empty__hint">
                        Extrai valor real, vencimento e linha digitável • Clique, arraste ou <strong>Ctrl+V</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seção 1: Confirmar Fatura / Boleto */}
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border, rgba(128,128,128,0.22))',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                1. Dados da Fatura / Boleto do Mês
              </div>

              {ocorrencia.valorEstimado != null && (
                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                  Estimativa calculada (média 3 meses):{' '}
                  <strong>{formatarMoeda(ocorrencia.valorEstimado)}</strong>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="cp-field">
                  <label>Valor Real do Boleto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Confirme quando chegar"
                    value={valorReal}
                    onChange={(e) => {
                      setValorReal(e.target.value)
                      setValorPago(e.target.value)
                    }}
                  />
                </div>
                <div className="cp-field">
                  <label>Data de Vencimento</label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
              </div>

              <div className="cp-field">
                <label>Linha Digitável / Código de Barras (opcional)</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Cole aqui para pagar depois..."
                    value={linhaDigitavel}
                    onChange={(e) => setLinhaDigitavel(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {linhaDigitavel && (
                    <button
                      type="button"
                      className="contas-pagar__btn"
                      onClick={handleCopyLinha}
                      title="Copiar linha digitável"
                    >
                      {copied ? <Check size={15} color="#27ae60" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="cp-field">
                <label>Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Consumo 180 kWh, bandeira amarela..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="contas-pagar__btn"
                onClick={handleConfirmarDados}
                disabled={loading}
              >
                Salvar / Confirmar Valor (Sem Pagar Ainda)
              </button>
            </div>

            {/* Seção 2: Registrar Pagamento */}
            {ocorrencia.status !== 'CANCELADA' && (
              <form
                onSubmit={handlePagar}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(39, 174, 96, 0.35)',
                  background: 'rgba(39, 174, 96, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#27ae60' }}>
                  2. Registrar Pagamento
                </div>

                {ocorrencia.modeloTipo !== 'PARCELADO' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      className={`contas-pagar__btn ${meio === 'CONTA' ? 'contas-pagar__btn--primary' : ''}`}
                      onClick={() => setMeio('CONTA')}
                    >
                      Conta Bancária (Boleto/Débito)
                    </button>
                    <button
                      type="button"
                      className={`contas-pagar__btn ${meio === 'CARTAO' ? 'contas-pagar__btn--primary' : ''}`}
                      onClick={() => setMeio('CARTAO')}
                    >
                      Cartão de Crédito
                    </button>
                  </div>
                )}

                {meio === 'CONTA' ? (
                  <div className="cp-field">
                    <label>Debitar da Conta Bancária *</label>
                    <select value={contaId} onChange={(e) => setContaId(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {contas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({formatarMoeda(c.saldo)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="cp-field">
                    <label>Lançar na Fatura do Cartão *</label>
                    <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {cartoes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="cp-field">
                    <label>Valor Efetivamente Pago (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target.value)}
                      required
                    />
                  </div>
                  <div className="cp-field">
                    <label>Data do Pagamento *</label>
                    <input
                      type="date"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="contas-pagar__btn contas-pagar__btn--primary"
                  disabled={loading}
                  style={{ justifyContent: 'center', padding: '11px' }}
                >
                  <CheckCircle2 size={16} /> Marcar como PAGA e Debitar
                </button>
              </form>
            )}

            {/* Cancelar ocorrência no mês */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {ocorrencia.status === 'CANCELADA' ? (
                <button
                  type="button"
                  className="contas-pagar__btn"
                  onClick={() => handleToggleCancelamento(false)}
                  disabled={loading}
                >
                  Reativar ocorrência neste mês
                </button>
              ) : (
                <button
                  type="button"
                  className="contas-pagar__btn contas-pagar__btn--danger"
                  onClick={() => handleToggleCancelamento(true)}
                  disabled={loading}
                >
                  <Ban size={14} /> Não haverá cobrança neste mês (Cancelar)
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
