import { useEffect, useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { ImagePlus, Sparkles, CheckCircle2, AlertCircle, Trash2, Loader2 } from 'lucide-react'
import { ContaPagarModelo, TipoContaPagar } from '../../../types/contasPagar'
import { categoryService } from '../../../services/categoryService'
import { contaService } from '../../../services/contaService'
import { contaPagarService } from '../../../services/contaPagarService'
import { iaService } from '../../../services/iaService'

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

interface ModeloModalProps {
  modeloEditar?: ContaPagarModelo | null
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export function ModeloModal({ modeloEditar, onClose, onSaved, onError }: ModeloModalProps) {
  const isEdit = !!modeloEditar
  const hoje = new Date().toISOString().split('T')[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(modeloEditar?.nome || '')
  const [tipo, setTipo] = useState<TipoContaPagar>(modeloEditar?.tipo || 'VARIAVEL')
  const [categoriaId, setCategoriaId] = useState(modeloEditar?.categoriaId || '')
  const [agrupador, setAgrupador] = useState(modeloEditar?.agrupador || '')
  const [diaVencimento, setDiaVencimento] = useState(String(modeloEditar?.diaVencimento || 10))
  const [valorPadrao, setValorPadrao] = useState(
    modeloEditar?.valorPadrao != null ? String(modeloEditar.valorPadrao) : '',
  )
  const [totalParcelas, setTotalParcelas] = useState(
    modeloEditar?.totalParcelas != null ? String(modeloEditar.totalParcelas) : '360',
  )
  const [parcelaInicial, setParcelaInicial] = useState(
    modeloEditar?.parcelaInicial != null ? String(modeloEditar.parcelaInicial) : '1',
  )
  const [dataInicio, setDataInicio] = useState(modeloEditar?.dataInicio || hoje)
  const [dataFim, setDataFim] = useState(modeloEditar?.dataFim || '')
  const [debitoAutomatico, setDebitoAutomatico] = useState(
    Boolean(modeloEditar?.debitoAutomatico),
  )
  const [contaPadraoId, setContaPadraoId] = useState(modeloEditar?.contaPadraoId || '')
  const [aplicarFuturas, setAplicarFuturas] = useState(true)
  const [linhaDigitavel, setLinhaDigitavel] = useState('')
  const [observacao, setObservacao] = useState('')

  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Estados de leitura de Conta / Boleto por IA
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [extractingReceipt, setExtractingReceipt] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [receiptSuccessInfo, setReceiptSuccessInfo] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setCategorias(list)
      if (!categoriaId && list.length > 0) setCategoriaId(list[0].id)
    })
    contaService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setContas(list)
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
        if (
          !isEdit &&
          ext.tipoContaPagar &&
          ['VARIAVEL', 'FIXO', 'PARCELADO', 'AVULSO'].includes(ext.tipoContaPagar)
        ) {
          setTipo(ext.tipoContaPagar)
        }

        if (ext.nome && ext.nome.trim()) {
          setNome(ext.nome.trim())
        }

        if (ext.valor != null && !isNaN(Number(ext.valor)) && Number(ext.valor) > 0) {
          setValorPadrao(Number(ext.valor).toFixed(2))
        }

        if (ext.diaVencimento != null && Number(ext.diaVencimento) >= 1 && Number(ext.diaVencimento) <= 31) {
          setDiaVencimento(String(Math.round(Number(ext.diaVencimento))))
        } else if (ext.dataVencimento && /^\d{4}-\d{2}-\d{2}$/.test(ext.dataVencimento)) {
          const dayPart = parseInt(ext.dataVencimento.split('-')[2], 10)
          if (dayPart >= 1 && dayPart <= 31) setDiaVencimento(String(dayPart))
        }

        if (!isEdit && ext.dataVencimento && /^\d{4}-\d{2}-\d{2}$/.test(ext.dataVencimento)) {
          setDataInicio(ext.dataVencimento)
        }

        if (ext.linhaDigitavel && ext.linhaDigitavel.trim()) {
          setLinhaDigitavel(ext.linhaDigitavel.trim())
        }

        if (ext.observacao && ext.observacao.trim()) {
          setObservacao(ext.observacao.trim())
        }

        if (!isEdit && ext.totalParcelas != null && Number(ext.totalParcelas) > 1) {
          setTotalParcelas(String(Math.round(Number(ext.totalParcelas))))
          setTipo('PARCELADO')
        }

        if (!isEdit && ext.numeroParcela != null && Number(ext.numeroParcela) >= 1) {
          setParcelaInicial(String(Math.round(Number(ext.numeroParcela))))
        }

        if (ext.categoriaId) {
          setCategoriaId(ext.categoriaId)
        } else if (ext.categoriaSugerida) {
          const matchCat = categorias.find(
            (c) =>
              c.nome.toLowerCase() === ext.categoriaSugerida!.trim().toLowerCase() ||
              c.nome.toLowerCase().includes(ext.categoriaSugerida!.trim().toLowerCase())
          )
          if (matchCat) setCategoriaId(matchCat.id)
        }

        if (ext.contaBancariaId) {
          setContaPadraoId(ext.contaBancariaId)
        }

        setReceiptSuccessInfo(
          ext.justificativa || 'Dados extraídos da conta/boleto! Confira os campos antes de salvar.'
        )
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setReceiptError(
        axiosErr?.response?.data?.error ||
          'Não foi possível ler a imagem da conta/boleto. Preencha manualmente.'
      )
    } finally {
      setExtractingReceipt(false)
    }
  }, [categorias, isEdit])

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (extractingReceipt || submitting) return
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
  }, [extractingReceipt, submitting, processReceiptFile])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processReceiptFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    if (extractingReceipt || submitting) return
    const file = e.dataTransfer.files?.[0]
    if (file) processReceiptFile(file)
  }

  function handleClearReceipt() {
    setReceiptPreview(null)
    setReceiptError(null)
    setReceiptSuccessInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return onError('Informe o nome da conta.')
    if (!categoriaId) return onError('Selecione uma categoria.')
    const dia =
      tipo === 'AVULSO' && dataInicio && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio)
        ? parseInt(dataInicio.split('-')[2], 10)
        : parseInt(diaVencimento, 10)
    if (isNaN(dia) || dia < 1 || dia > 31) return onError('Dia de vencimento deve ser entre 1 e 31.')

    const valNum = valorPadrao ? parseFloat(valorPadrao.replace(',', '.')) : null
    if ((tipo === 'FIXO' || tipo === 'PARCELADO' || tipo === 'AVULSO') && (!valNum || valNum <= 0)) {
      return onError('Informe o valor do boleto/conta.')
    }
    if (debitoAutomatico && !contaPadraoId) {
      return onError('Selecione a conta padrão para o débito automático.')
    }

    setSubmitting(true)
    try {
      if (isEdit && modeloEditar) {
        await contaPagarService.editarModelo(modeloEditar.id, {
          nome: nome.trim(),
          categoriaId,
          agrupador: agrupador.trim() || null,
          diaVencimento: dia,
          valorPadrao: valNum,
          dataFim: dataFim || null,
          debitoAutomatico,
          contaPadraoId: contaPadraoId || null,
          aplicarValorOcorrenciasFuturas: aplicarFuturas,
        })
      } else {
        await contaPagarService.criarModelo({
          nome: nome.trim(),
          tipo,
          categoriaId,
          agrupador: agrupador.trim() || null,
          diaVencimento: dia,
          valorPadrao: valNum,
          totalParcelas: tipo === 'PARCELADO' ? parseInt(totalParcelas, 10) : tipo === 'AVULSO' ? 1 : null,
          parcelaInicial: tipo === 'PARCELADO' ? parseInt(parcelaInicial || '1', 10) : tipo === 'AVULSO' ? 1 : null,
          dataInicio,
          dataFim: tipo === 'AVULSO' ? dataInicio : tipo !== 'PARCELADO' && dataFim ? dataFim : null,
          debitoAutomatico,
          contaPadraoId: contaPadraoId || null,
          linhaDigitavel: linhaDigitavel.trim() || null,
          observacao: observacao.trim() || null,
        })
      }
      onSaved()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao salvar modelo de conta.')
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
      <div className="modal" style={{ maxWidth: '540px', width: '100%' }}>
        <div className="modal__header">
          <h2 className="modal__title">
            {isEdit ? `Editar: ${modeloEditar?.nome}` : 'Nova Conta a Pagar / Financiamento'}
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Captura de Conta / Boleto / Financiamento via IA */}
          <div className="receipt-ai-box">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={extractingReceipt || submitting}
            />

            <div
              className={`receipt-ai-dropzone ${isDraggingOver ? 'receipt-ai-dropzone--drag' : ''} ${
                extractingReceipt ? 'receipt-ai-dropzone--loading' : ''
              } ${receiptSuccessInfo ? 'receipt-ai-dropzone--success' : ''}`}
              onClick={() => {
                if (!extractingReceipt && !submitting) {
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!extractingReceipt && !submitting) setIsDraggingOver(true)
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
                if ((e.key === 'Enter' || e.key === ' ') && !extractingReceipt && !submitting) {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              {receiptPreview ? (
                <div className="receipt-ai-preview">
                  <img
                    src={receiptPreview}
                    alt="Conta ou boleto enviado"
                    className="receipt-ai-preview__img"
                  />
                  <div className="receipt-ai-preview__info">
                    {extractingReceipt ? (
                      <>
                        <div className="receipt-ai-preview__badge receipt-ai-preview__badge--loading">
                          <Loader2 size={14} className="receipt-ai-spin" />
                          <span>Lendo conta / boleto com IA...</span>
                        </div>
                        <p className="receipt-ai-preview__sub">
                          Identificando tipo (variável/fixa/financiamento), vencimento, valor e parcelas
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
                          <span>Preenchido via Leitura de Boleto IA</span>
                        </div>
                        <p className="receipt-ai-preview__sub">
                          {receiptSuccessInfo || 'Confira os dados abaixo antes de salvar.'}
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
                      <span>Enviar foto ou print da conta / boleto</span>
                      <span className="receipt-ai-empty__pill">
                        <Sparkles size={11} />
                        Auto-preencher IA
                      </span>
                    </div>
                    <p className="receipt-ai-empty__hint">
                      Conta de Luz, Água, Condomínio ou Boleto de Financiamento • Clique, arraste ou <strong>Ctrl+V</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isEdit && (
            <div className="cp-field">
              <label>Tipo de Conta</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {(
                  [
                    { id: 'VARIAVEL', title: 'Variável', sub: 'Água, Luz, Gás' },
                    { id: 'FIXO', title: 'Fixa Mensal', sub: 'Condomínio, Internet' },
                    { id: 'PARCELADO', title: 'Parcelada / Imóvel', sub: 'Financiamento, IPTU' },
                    { id: 'AVULSO', title: 'Boleto Único / Avulso', sub: 'Taxa Detran, Multa, Serviço' },
                  ] as const
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setTipo(op.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: `2px solid ${tipo === op.id ? 'var(--primary, #2f5b4b)' : 'var(--border, rgba(128,128,128,0.25))'}`,
                      background: tipo === op.id ? 'rgba(47, 91, 75, 0.14)' : 'transparent',
                      color: 'inherit',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{op.title}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{op.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="cp-field">
              <label>{tipo === 'AVULSO' ? 'Descrição do Boleto *' : 'Nome da Conta *'}</label>
              <input
                type="text"
                placeholder={
                  tipo === 'VARIAVEL'
                    ? 'Ex: Conta de Luz - Enel'
                    : tipo === 'PARCELADO'
                    ? 'Ex: Financiamento Imóvel Caixa'
                    : tipo === 'AVULSO'
                    ? 'Ex: Taxa Detran - Licenciamento'
                    : 'Ex: Condomínio'
                }
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="cp-field">
              <label>Agrupador / Imóvel (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Apto Novo, Carro"
                value={agrupador}
                onChange={(e) => setAgrupador(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="cp-field">
              <label>Categoria *</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {tipo === 'AVULSO' ? (
              <div className="cp-field">
                <label>Data de Vencimento *</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value)
                    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
                      setDiaVencimento(String(parseInt(e.target.value.split('-')[2], 10)))
                    }
                  }}
                  required
                />
              </div>
            ) : (
              <div className="cp-field">
                <label>Dia de Vencimento (1–31) *</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={diaVencimento}
                  onChange={(e) => setDiaVencimento(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="cp-field">
              <label>
                {tipo === 'VARIAVEL'
                  ? 'Estimativa inicial (R$)'
                  : tipo === 'PARCELADO'
                  ? 'Parcela estimada atual (R$) *'
                  : tipo === 'AVULSO'
                  ? 'Valor do Boleto (R$) *'
                  : 'Valor mensal (R$) *'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorPadrao}
                onChange={(e) => setValorPadrao(e.target.value)}
              />
            </div>
          </div>

          {!isEdit && tipo === 'AVULSO' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="cp-field">
                <label>Linha Digitável / Código de Barras (opcional)</label>
                <input
                  type="text"
                  placeholder="Cole ou extraia via imagem do boleto..."
                  value={linhaDigitavel}
                  onChange={(e) => setLinhaDigitavel(e.target.value)}
                />
              </div>
              <div className="cp-field">
                <label>Observação (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Guia RENAVAM, Serviço CNH..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>
          )}

          {!isEdit && tipo === 'PARCELADO' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(124, 92, 252, 0.08)',
              }}
            >
              <div className="cp-field">
                <label>Total de Parcelas *</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  required
                />
              </div>
              <div className="cp-field">
                <label>Começar na Parcela nº *</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={parcelaInicial}
                  onChange={(e) => setParcelaInicial(e.target.value)}
                  required
                />
              </div>
              <div className="cp-field">
                <label>Mês desta Parcela *</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {tipo !== 'PARCELADO' && tipo !== 'AVULSO' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {!isEdit && (
                <div className="cp-field">
                  <label>Mês de Início *</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="cp-field">
                <label>Data de Encerramento (opcional)</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border, rgba(128,128,128,0.2))',
            }}
          >
            <div className="cp-field">
              <label>Conta Bancária Padrão</label>
              <select value={contaPadraoId} onChange={(e) => setContaPadraoId(e.target.value)}>
                <option value="">Nenhuma (escolher ao pagar)</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                marginTop: '16px',
              }}
            >
              <input
                type="checkbox"
                checked={debitoAutomatico}
                onChange={(e) => setDebitoAutomatico(e.target.checked)}
              />
              <span>
                <strong>Débito Automático</strong>
                <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                  Paga no vencimento se o valor real estiver confirmado
                </div>
              </span>
            </label>
          </div>

          {isEdit && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
              <input
                type="checkbox"
                checked={aplicarFuturas}
                onChange={(e) => setAplicarFuturas(e.target.checked)}
              />
              Aplicar novo valor padrão às ocorrências futuras ainda pendentes
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="contas-pagar__btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="contas-pagar__btn contas-pagar__btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
