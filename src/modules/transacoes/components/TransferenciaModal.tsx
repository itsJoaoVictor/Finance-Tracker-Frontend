import { useState, FormEvent, useEffect, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { ImagePlus, Sparkles, CheckCircle2, AlertCircle, Trash2, Loader2 } from 'lucide-react'
import { TransferenciaRequest, Conta } from '../../../types'
import { contaService } from '../../../services/contaService'
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

interface TransferenciaModalProps {
  onClose: () => void
  onSubmit: (data: TransferenciaRequest) => Promise<void>
}

export function TransferenciaModal({ onClose, onSubmit }: TransferenciaModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contaOrigemId, setContaOrigemId] = useState('')
  const [contaDestinoId, setContaDestinoId] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')

  const [contas, setContas] = useState<Conta[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estados de leitura de comprovante via IA
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [extractingReceipt, setExtractingReceipt] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [receiptSuccessInfo, setReceiptSuccessInfo] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const contasRes = await contaService.getAll()
        setContas(contasRes.data)
      } catch {
        // ignore
      } finally {
        setLoadingData(false)
      }
    }
    load()
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

      const res = await iaService.extrairComprovante(base64DataUri)
      const ext = res.data

      if (ext) {
        if (ext.contaOrigemId) {
          setContaOrigemId(ext.contaOrigemId)
        } else if (ext.contaOrigemSugerida) {
          const matchOrigem = contas.find(
            (c) =>
              c.nome.toLowerCase() === ext.contaOrigemSugerida!.trim().toLowerCase() ||
              c.nome.toLowerCase().includes(ext.contaOrigemSugerida!.trim().toLowerCase())
          )
          if (matchOrigem) setContaOrigemId(matchOrigem.id)
        }

        if (ext.contaDestinoId) {
          setContaDestinoId(ext.contaDestinoId)
        } else if (ext.contaDestinoSugerida) {
          const matchDestino = contas.find(
            (c) =>
              c.nome.toLowerCase() === ext.contaDestinoSugerida!.trim().toLowerCase() ||
              c.nome.toLowerCase().includes(ext.contaDestinoSugerida!.trim().toLowerCase())
          )
          if (matchDestino) setContaDestinoId(matchDestino.id)
        }

        if (ext.valor != null && !isNaN(Number(ext.valor)) && Number(ext.valor) > 0) {
          setValor(Number(ext.valor).toFixed(2))
        }

        if (ext.descricao && ext.descricao.trim()) {
          setDescricao(ext.descricao.trim())
        }

        setErrors({})
        setReceiptSuccessInfo(
          ext.justificativa || 'Dados extraídos do comprovante! Confira as contas e o valor.'
        )
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setReceiptError(
        axiosErr?.response?.data?.error ||
          'Não foi possível extrair os dados da imagem. Preencha os campos manualmente.'
      )
    } finally {
      setExtractingReceipt(false)
    }
  }, [contas])

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (extractingReceipt || loadingSubmit) return
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
  }, [extractingReceipt, loadingSubmit, processReceiptFile])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processReceiptFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    if (extractingReceipt || loadingSubmit) return
    const file = e.dataTransfer.files?.[0]
    if (file) processReceiptFile(file)
  }

  function handleClearReceipt() {
    setReceiptPreview(null)
    setReceiptError(null)
    setReceiptSuccessInfo(null)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!contaOrigemId) e.contaOrigemId = 'Conta origem é obrigatória'
    if (!contaDestinoId) e.contaDestinoId = 'Conta destino é obrigatória'
    if (contaOrigemId && contaDestinoId && contaOrigemId === contaDestinoId) {
      e.contaDestinoId = 'Conta destino deve ser diferente da origem'
    }
    const v = parseFloat(valor)
    if (valor === '' || isNaN(v) || v <= 0) e.valor = 'Valor deve ser maior que zero'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoadingSubmit(true)
    try {
      await onSubmit({
        contaOrigemId,
        contaDestinoId,
        valor: parseFloat(valor),
        descricao: descricao.trim() || undefined,
        categoriaId: undefined,
      })
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-transferencia-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-transferencia-title">Transferir entre Contas</h2>
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

          {/* Captura de Comprovante de Transferência com IA */}
          <div className="receipt-ai-box">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={extractingReceipt || loadingSubmit}
            />

            <div
              className={`receipt-ai-dropzone ${isDraggingOver ? 'receipt-ai-dropzone--drag' : ''} ${
                extractingReceipt ? 'receipt-ai-dropzone--loading' : ''
              } ${receiptSuccessInfo ? 'receipt-ai-dropzone--success' : ''}`}
              onClick={() => {
                if (!extractingReceipt && !loadingSubmit) {
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!extractingReceipt && !loadingSubmit) setIsDraggingOver(true)
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
                if ((e.key === 'Enter' || e.key === ' ') && !extractingReceipt && !loadingSubmit) {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              {receiptPreview ? (
                <div className="receipt-ai-preview">
                  <img
                    src={receiptPreview}
                    alt="Comprovante enviado"
                    className="receipt-ai-preview__img"
                  />
                  <div className="receipt-ai-preview__info">
                    {extractingReceipt ? (
                      <>
                        <div className="receipt-ai-preview__badge receipt-ai-preview__badge--loading">
                          <Loader2 size={14} className="receipt-ai-spin" />
                          <span>Lendo comprovante com IA...</span>
                        </div>
                        <p className="receipt-ai-preview__sub">
                          Identificando contas, valor e descrição da transferência
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
                          <span>Preenchido via Comprovante IA</span>
                        </div>
                        <p className="receipt-ai-preview__sub">
                          {receiptSuccessInfo || 'Confira os dados abaixo antes de transferir.'}
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
                      <span>Enviar comprovante de transferência</span>
                      <span className="receipt-ai-empty__pill">
                        <Sparkles size={11} />
                        Auto-preencher IA
                      </span>
                    </div>
                    <p className="receipt-ai-empty__hint">
                      Clique para escolher, arraste a imagem ou cole com <strong>Ctrl+V</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conta Origem */}
          <div className="form-group">
            <label htmlFor="transferencia-conta-origem">Conta Origem</label>
            <select
              id="transferencia-conta-origem"
              value={contaOrigemId}
              onChange={(e) => setContaOrigemId(e.target.value)}
              className={errors.contaOrigemId ? 'error' : ''}
              disabled={loadingSubmit}
            >
              <option value="">Selecione a conta de origem</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.contaOrigemId && <p className="form-error">{errors.contaOrigemId}</p>}
          </div>

          {/* Conta Destino */}
          <div className="form-group">
            <label htmlFor="transferencia-conta-destino">Conta Destino</label>
            <select
              id="transferencia-conta-destino"
              value={contaDestinoId}
              onChange={(e) => setContaDestinoId(e.target.value)}
              className={errors.contaDestinoId ? 'error' : ''}
              disabled={loadingSubmit}
            >
              <option value="">Selecione a conta de destino</option>
              {contas
                .filter((c) => c.id !== contaOrigemId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
            </select>
            {errors.contaDestinoId && <p className="form-error">{errors.contaDestinoId}</p>}
          </div>

          {/* Valor */}
          <div className="form-group">
            <label htmlFor="transferencia-valor">Valor (R$)</label>
            <input
              id="transferencia-valor"
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

          {/* Descrição */}
          <div className="form-group">
            <label htmlFor="transferencia-descricao">Descrição (opcional)</label>
            <input
              id="transferencia-descricao"
              type="text"
              placeholder="Ex: Pagamento de aluguel"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={200}
              disabled={loadingSubmit}
            />
          </div>

          {/* Ações */}
          <div className="modal__actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loadingSubmit}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loadingSubmit || loadingData}>
              {loadingSubmit ? 'Transferindo...' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}