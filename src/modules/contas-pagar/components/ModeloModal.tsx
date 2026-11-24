import { useEffect, useState, useCallback, useMemo, useRef, DragEvent, ChangeEvent } from 'react'
import {
  ImagePlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  RotateCcw,
} from 'lucide-react'
import { ContaPagarModelo, FinanciamentoResumo, ModoParcelamento, TipoContaPagar } from '../../../types/contasPagar'
import { categoryService } from '../../../services/categoryService'
import { contaService } from '../../../services/contaService'
import { contaPagarService } from '../../../services/contaPagarService'
import { iaService } from '../../../services/iaService'

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const INTERVALOS_OPCOES = [
  { value: 1, label: 'Mensal (todo mês)' },
  { value: 2, label: 'Bimestral (a cada 2 meses)' },
  { value: 3, label: 'Trimestral (a cada 3 meses)' },
  { value: 6, label: 'Semestral (a cada 6 meses)' },
  { value: 12, label: 'Anual (a cada 12 meses)' },
]

function calcularValorProgressivo(
  inicial: number,
  final: number,
  indice: number,
  quantidadeTotal: number,
): number {
  if (quantidadeTotal <= 1 || !isFinite(final)) return Math.round(inicial * 100) / 100
  if (indice <= 0) return Math.round(inicial * 100) / 100
  if (indice >= quantidadeTotal - 1) return Math.round(final * 100) / 100
  const val = inicial + ((final - inicial) * indice) / (quantidadeTotal - 1)
  return Math.round(val * 100) / 100
}

function formatarMoeda(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatarMesOffset(dataInicioIso: string, offset: number, intervaloMeses: number): string {
  if (!dataInicioIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataInicioIso)) return ''
  const [y, m] = dataInicioIso.split('-').map((n) => parseInt(n, 10))
  const d = new Date(y, m - 1 + offset * intervaloMeses, 1)
  return `${MESES_CURTOS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

function parseNumeroFlexivel(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  let normalized = s

  if (hasDot && hasComma) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      normalized = s.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`
    } else {
      normalized = s.replace(/,/g, '')
    }
  } else if (hasDot) {
    const parts = s.split('.')
    const last = parts[parts.length - 1]
    if (parts.length > 2) {
      if (last.length <= 2) {
        normalized = `${parts.slice(0, -1).join('')}.${last}`
      } else {
        normalized = parts.join('')
      }
    } else if (last.length === 3 && parts[0].length <= 3) {
      normalized = parts.join('')
    }
  }

  const num = parseFloat(normalized)
  if (!isFinite(num) || num <= 0) return null
  return Math.round(num * 100) / 100
}

function parseValoresColados(texto: string): number[] {
  const limpo = texto
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, ' ')
    .replace(/\b\d{1,2}\/\d{2,4}\b/g, ' ')
    .replace(/\bparcela\s*\d+\s*:?/gi, ' ')
    .replace(/\b[mp]\d+\b/gi, ' ')
    .replace(/\b\d+\s*[ªº°]/g, ' ')
    .replace(/R\$/gi, ' ')

  const matches = limpo.match(/\d+(?:[.,]\d+)*/g) || []
  const valores: number[] = []
  for (const m of matches) {
    const num = parseNumeroFlexivel(m)
    if (num != null) valores.push(num)
  }
  return valores
}

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
  financiamentoInicialId?: string | null
  tipoInicial?: TipoContaPagar
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export function ModeloModal({
  modeloEditar,
  financiamentoInicialId,
  tipoInicial,
  onClose,
  onSaved,
  onError,
}: ModeloModalProps) {
  const isEdit = !!modeloEditar
  const hoje = new Date().toISOString().split('T')[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(modeloEditar?.nome || '')
  const [tipo, setTipo] = useState<TipoContaPagar>(modeloEditar?.tipo || tipoInicial || 'VARIAVEL')
  const [categoriaId, setCategoriaId] = useState(modeloEditar?.categoriaId || '')
  const [agrupador, setAgrupador] = useState(modeloEditar?.agrupador || '')
  const [financiamentoId, setFinanciamentoId] = useState(
    modeloEditar?.financiamentoId || financiamentoInicialId || '',
  )
  const [financiamentos, setFinanciamentos] = useState<FinanciamentoResumo[]>([])
  const [diaVencimento, setDiaVencimento] = useState(String(modeloEditar?.diaVencimento || 10))
  const [valorPadrao, setValorPadrao] = useState(
    modeloEditar?.valorPadrao != null ? String(modeloEditar.valorPadrao) : '',
  )
  const [totalParcelas, setTotalParcelas] = useState(
    modeloEditar?.totalParcelas != null ? String(modeloEditar.totalParcelas) : '12',
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

  // Campos de Parcelamento (Fixo / Progressivo / Personalizado)
  const [modoParcelamento, setModoParcelamento] = useState<ModoParcelamento>(
    modeloEditar?.modoParcelamento || 'FIXO',
  )
  const [valorUltimaParcela, setValorUltimaParcela] = useState(
    modeloEditar?.valorUltimaParcela != null ? String(modeloEditar.valorUltimaParcela) : '',
  )
  const [progressivoInputMode, setProgressivoInputMode] = useState<'ULTIMA' | 'VARIACAO'>('ULTIMA')
  const [variacaoMensal, setVariacaoMensal] = useState('')
  const [intervaloMeses, setIntervaloMeses] = useState(
    String(modeloEditar?.intervaloMeses || 1),
  )
  const [valoresEstimados, setValoresEstimados] = useState(
    Boolean(modeloEditar?.valoresEstimados),
  )
  const [valoresEstimadosTouched, setValoresEstimadosTouched] = useState(isEdit)
  const [valoresCustom, setValoresCustom] = useState<Record<number, string>>({})
  const [mostrarPreviewParcelas, setMostrarPreviewParcelas] = useState(false)
  const [textoColarValores, setTextoColarValores] = useState('')
  const [colarFeedback, setColarFeedback] = useState<string | null>(null)

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
    contaPagarService
      .listarFinanciamentos()
      .then((res) => setFinanciamentos(res.data || []))
      .catch(() => setFinanciamentos([]))
  }, [])

  const totalParcelasNum = Math.max(1, parseInt(totalParcelas || '1', 10) || 1)
  const parcelaInicialNum = Math.max(1, Math.min(totalParcelasNum, parseInt(parcelaInicial || '1', 10) || 1))
  const qtdRestante = Math.max(1, totalParcelasNum - parcelaInicialNum + 1)
  const intervaloNum = Math.max(1, parseInt(intervaloMeses || '1', 10) || 1)

  const valorInicialNum = parseFloat(valorPadrao.replace(',', '.'))
  const valorUltimaNum = parseFloat(valorUltimaParcela.replace(',', '.'))

  const handleSelectModoParcelamento = (novoModo: ModoParcelamento) => {
    setModoParcelamento(novoModo)
    setColarFeedback(null)
    if (!isEdit && !valoresEstimadosTouched) {
      setValoresEstimados(novoModo === 'PROGRESSIVO')
    }
    if (novoModo === 'PERSONALIZADO') {
      // Pré-preencher a lista com a curva atual se ainda estiver vazia e houver até 60 parcelas
      if (Object.keys(valoresCustom).length === 0 && qtdRestante <= 60 && isFinite(valorInicialNum) && valorInicialNum > 0) {
        const initMap: Record<number, string> = {}
        for (let i = 0; i < qtdRestante; i++) {
          const v =
            modoParcelamento === 'PROGRESSIVO' && isFinite(valorUltimaNum) && valorUltimaNum > 0
              ? calcularValorProgressivo(valorInicialNum, valorUltimaNum, i, qtdRestante)
              : valorInicialNum
          initMap[i] = v.toFixed(2)
        }
        setValoresCustom(initMap)
      }
    }
  }

  const handleVariacaoMensalChange = (raw: string) => {
    setVariacaoMensal(raw)
    const delta = parseFloat(raw.replace(',', '.'))
    if (isFinite(delta) && isFinite(valorInicialNum) && valorInicialNum > 0) {
      const calcFinal = Math.max(0.01, Math.round((valorInicialNum + delta * (qtdRestante - 1)) * 100) / 100)
      setValorUltimaParcela(calcFinal.toFixed(2))
    }
  }

  const handleAplicarListaColada = () => {
    const parsed = parseValoresColados(textoColarValores)
    if (parsed.length === 0) {
      setColarFeedback('Nenhum valor numérico encontrado. Ex.: 1950; 1950; 1334,70')
      return
    }
    const novoMap: Record<number, string> = {}
    parsed.forEach((v, idx) => {
      novoMap[idx] = v.toFixed(2)
    })
    setValoresCustom(novoMap)

    if (modoParcelamento === 'PERSONALIZADO') {
      if (parcelaInicialNum === 1 && parsed.length !== totalParcelasNum) {
        setTotalParcelas(String(parsed.length))
        setColarFeedback(`${parsed.length} valor(es) aplicado(s) — total de parcelas ajustado para ${parsed.length}.`)
      } else {
        setColarFeedback(`${parsed.length} valor(es) aplicado(s) às parcelas.`)
      }
      setValorPadrao(parsed[0].toFixed(2))
    } else {
      setColarFeedback(`${parsed.length} valor(es) aplicado(s) como ajuste individual.`)
    }
    setTextoColarValores('')
  }

  const resumoParcelamento = useMemo(() => {
    if (tipo !== 'PARCELADO') return null

    const temInicial = isFinite(valorInicialNum) && valorInicialNum > 0
    const temUltima = isFinite(valorUltimaNum) && valorUltimaNum > 0

    let totalEstimado = 0
    let primeiro = 0
    let ultimo = 0
    let customCount = 0

    if (modoParcelamento === 'PERSONALIZADO') {
      let preenchidas = 0
      for (let i = 0; i < qtdRestante; i++) {
        const v = parseFloat((valoresCustom[i] || '').replace(',', '.'))
        if (isFinite(v) && v > 0) {
          if (i === 0) primeiro = v
          if (i === qtdRestante - 1) ultimo = v
          totalEstimado += v
          preenchidas++
        }
      }
      return {
        valido: preenchidas === qtdRestante,
        preenchidas,
        primeiro,
        ultimo,
        totalEstimado,
        variacaoMedia: 0,
        direcao: 'CUSTOM' as const,
        customCount: preenchidas,
      }
    }

    if (!temInicial) return null
    const finalEfetivo = modoParcelamento === 'PROGRESSIVO' ? (qtdRestante === 1 ? valorInicialNum : valorUltimaNum) : valorInicialNum
    if (modoParcelamento === 'PROGRESSIVO' && qtdRestante > 1 && !temUltima) return null

    // Soma analítica para séries grandes + ajustes pontuais
    if (modoParcelamento === 'PROGRESSIVO') {
      totalEstimado = ((valorInicialNum + finalEfetivo) / 2) * qtdRestante
    } else {
      totalEstimado = valorInicialNum * qtdRestante
    }

    primeiro = valorInicialNum
    ultimo = finalEfetivo

    // Aplica overrides manuais no cálculo do total e pontas
    Object.entries(valoresCustom).forEach(([k, strVal]) => {
      const idx = parseInt(k, 10)
      if (idx < 0 || idx >= qtdRestante) return
      const ov = parseFloat((strVal || '').replace(',', '.'))
      if (!isFinite(ov) || ov <= 0) return
      const base =
        modoParcelamento === 'PROGRESSIVO'
          ? calcularValorProgressivo(valorInicialNum, finalEfetivo, idx, qtdRestante)
          : valorInicialNum
      totalEstimado += ov - base
      if (idx === 0) primeiro = ov
      if (idx === qtdRestante - 1) ultimo = ov
      customCount++
    })

    const variacaoMedia = qtdRestante > 1 ? (finalEfetivo - valorInicialNum) / (qtdRestante - 1) : 0
    const direcao =
      modoParcelamento === 'FIXO' || Math.abs(variacaoMedia) < 0.005
        ? ('FIXO' as const)
        : variacaoMedia < 0
        ? ('DECRESCENTE' as const)
        : ('CRESCENTE' as const)

    return {
      valido: true,
      preenchidas: qtdRestante,
      primeiro,
      ultimo,
      totalEstimado,
      variacaoMedia,
      direcao,
      customCount,
    }
  }, [tipo, modoParcelamento, valorInicialNum, valorUltimaNum, qtdRestante, valoresCustom])

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
              c.nome.toLowerCase().includes(ext.categoriaSugerida!.trim().toLowerCase()),
          )
          if (matchCat) setCategoriaId(matchCat.id)
        }

        if (ext.contaBancariaId) {
          setContaPadraoId(ext.contaBancariaId)
        }

        setReceiptSuccessInfo(
          ext.justificativa || 'Dados extraídos da conta/boleto! Confira os campos antes de salvar.',
        )
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setReceiptError(
        axiosErr?.response?.data?.error ||
          'Não foi possível ler a imagem da conta/boleto. Preencha manualmente.',
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
    const valUltimaNum = valorUltimaParcela ? parseFloat(valorUltimaParcela.replace(',', '.')) : null

    if ((tipo === 'FIXO' || tipo === 'AVULSO') && (!valNum || valNum <= 0)) {
      return onError('Informe o valor do boleto/conta.')
    }

    let valoresParcelasPayload: (number | null)[] | null = null

    if (tipo === 'PARCELADO') {
      if (!isEdit && modoParcelamento === 'PERSONALIZADO') {
        const lista: number[] = []
        for (let i = 0; i < qtdRestante; i++) {
          const parsed = parseFloat((valoresCustom[i] || '').replace(',', '.'))
          if (!isFinite(parsed) || parsed <= 0) {
            return onError(`Informe um valor positivo para a parcela nº ${parcelaInicialNum + i}.`)
          }
          lista.push(Math.round(parsed * 100) / 100)
        }
        valoresParcelasPayload = lista
      } else if (modoParcelamento === 'PROGRESSIVO') {
        if (!valNum || valNum <= 0) {
          return onError('Informe o valor da parcela inicial/atual.')
        }
        if ((isEdit || qtdRestante > 1) && (!valUltimaNum || valUltimaNum <= 0)) {
          return onError('Informe o valor estimado da última parcela.')
        }
        if (!isEdit) {
          const customIndices = Object.keys(valoresCustom)
            .map((k) => parseInt(k, 10))
            .filter((idx) => idx >= 0 && idx < qtdRestante && (valoresCustom[idx] || '').trim() !== '')
          if (customIndices.length > 0) {
            const lista: (number | null)[] = Array(qtdRestante).fill(null)
            for (const idx of customIndices) {
              const parsed = parseFloat(valoresCustom[idx].replace(',', '.'))
              if (!isFinite(parsed) || parsed <= 0) {
                return onError(`Valor inválido na exceção da parcela nº ${parcelaInicialNum + idx}.`)
              }
              lista[idx] = Math.round(parsed * 100) / 100
            }
            valoresParcelasPayload = lista
          }
        }
      } else {
        // FIXO
        if (!valNum || valNum <= 0) {
          return onError('Informe o valor da parcela.')
        }
        if (!isEdit) {
          const customIndices = Object.keys(valoresCustom)
            .map((k) => parseInt(k, 10))
            .filter((idx) => idx >= 0 && idx < qtdRestante && (valoresCustom[idx] || '').trim() !== '')
          if (customIndices.length > 0) {
            const lista: (number | null)[] = Array(qtdRestante).fill(null)
            for (const idx of customIndices) {
              const parsed = parseFloat(valoresCustom[idx].replace(',', '.'))
              if (!isFinite(parsed) || parsed <= 0) {
                return onError(`Valor inválido na exceção da parcela nº ${parcelaInicialNum + idx}.`)
              }
              lista[idx] = Math.round(parsed * 100) / 100
            }
            valoresParcelasPayload = lista
          }
        }
      }
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
          modoParcelamento: tipo === 'PARCELADO' ? modoParcelamento : undefined,
          valorUltimaParcela: tipo === 'PARCELADO' && modoParcelamento === 'PROGRESSIVO' ? valUltimaNum : null,
          valoresEstimados: tipo === 'PARCELADO' ? valoresEstimados : undefined,
          financiamentoId: financiamentoId || null,
        })
      } else {
        await contaPagarService.criarModelo({
          nome: nome.trim(),
          tipo,
          categoriaId,
          agrupador: agrupador.trim() || null,
          diaVencimento: dia,
          valorPadrao:
            tipo === 'PARCELADO' && modoParcelamento === 'PERSONALIZADO' && valoresParcelasPayload?.length
              ? valoresParcelasPayload[0]
              : valNum,
          totalParcelas: tipo === 'PARCELADO' ? totalParcelasNum : tipo === 'AVULSO' ? 1 : null,
          parcelaInicial: tipo === 'PARCELADO' ? parcelaInicialNum : tipo === 'AVULSO' ? 1 : null,
          dataInicio,
          dataFim: tipo === 'AVULSO' ? dataInicio : tipo !== 'PARCELADO' && dataFim ? dataFim : null,
          debitoAutomatico,
          contaPadraoId: contaPadraoId || null,
          linhaDigitavel: linhaDigitavel.trim() || null,
          observacao: observacao.trim() || null,
          modoParcelamento: tipo === 'PARCELADO' ? modoParcelamento : undefined,
          valorUltimaParcela:
            tipo === 'PARCELADO' && modoParcelamento === 'PROGRESSIVO'
              ? qtdRestante === 1
                ? valNum
                : valUltimaNum
              : null,
          intervaloMeses: tipo === 'PARCELADO' ? intervaloNum : 1,
          valoresEstimados: tipo === 'PARCELADO' ? valoresEstimados : false,
          valoresParcelas: valoresParcelasPayload,
          financiamentoId: financiamentoId || null,
        })
      }
      onSaved()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao salvar modelo de conta.')
    } finally {
      setSubmitting(false)
    }
  }

  const mostrarCampoValorPrincipal = !(tipo === 'PARCELADO' && !isEdit && modoParcelamento === 'PERSONALIZADO')

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: tipo === 'PARCELADO' ? '640px' : '540px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
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
                    { id: 'PARCELADO', title: 'Parcelada / Financiamento', sub: 'Imóvel, Construtora, Taxa de Obra' },
                    { id: 'AVULSO', title: 'Boleto Único / Avulso', sub: 'Taxa Detran, Multa, Serviço' },
                  ] as const
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setTipo(op.id)}
                    className={`cp-type-card ${tipo === op.id ? 'cp-type-card--active' : ''}`}
                  >
                    <div className="cp-type-card__title">{op.title}</div>
                    <div className="cp-type-card__sub">{op.sub}</div>
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
                    ? 'Ex: Mensais Construtora, Taxa de Obra, MCMV'
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
                placeholder="Ex: Meu Apê, Carro"
                value={agrupador}
                onChange={(e) => setAgrupador(e.target.value)}
              />
            </div>
          </div>

          {financiamentos.length > 0 && (
            <div className="cp-field">
              <label>Vincular a um Financiamento / Projeto (opcional)</label>
              <select
                value={financiamentoId}
                onChange={(e) => setFinanciamentoId(e.target.value)}
              >
                <option value="">Nenhum (conta independente)</option>
                {financiamentos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: mostrarCampoValorPrincipal ? '1fr 1fr 1fr' : '1fr 1fr',
              gap: '12px',
            }}
          >
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

            {mostrarCampoValorPrincipal && (
              <div className="cp-field">
                <label>
                  {tipo === 'VARIAVEL'
                    ? 'Estimativa inicial (R$)'
                    : tipo === 'PARCELADO'
                    ? modoParcelamento === 'PROGRESSIVO'
                      ? 'Parcela inicial / atual (R$) *'
                      : 'Valor da parcela (R$) *'
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
            )}
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

          {/* Bloco completo de Parcelamento / Financiamento */}
          {tipo === 'PARCELADO' && (
            <div className="cp-parcel-panel">
              {/* Modo de Estipulação das Parcelas */}
              <div className="cp-field">
                <label>Como os valores das parcelas se comportam?</label>
                <div className="cp-mode-grid" style={isEdit ? { gridTemplateColumns: 'repeat(2, 1fr)' } : undefined}>
                  <button
                    type="button"
                    className={`cp-type-card ${modoParcelamento === 'FIXO' ? 'cp-type-card--active' : ''}`}
                    onClick={() => handleSelectModoParcelamento('FIXO')}
                  >
                    <div className="cp-type-card__title">Fixo (Price)</div>
                    <div className="cp-type-card__sub">Parcelas iguais, média ou teto</div>
                  </button>

                  <button
                    type="button"
                    className={`cp-type-card ${modoParcelamento === 'PROGRESSIVO' ? 'cp-type-card--active' : ''}`}
                    onClick={() => handleSelectModoParcelamento('PROGRESSIVO')}
                  >
                    <div className="cp-type-card__title">Progressivo</div>
                    <div className="cp-type-card__sub">Decrescente (SAC) ou Crescente (Obra)</div>
                  </button>

                  {!isEdit && (
                    <button
                      type="button"
                      className={`cp-type-card ${modoParcelamento === 'PERSONALIZADO' ? 'cp-type-card--active' : ''}`}
                      onClick={() => handleSelectModoParcelamento('PERSONALIZADO')}
                    >
                      <div className="cp-type-card__title">Personalizado</div>
                      <div className="cp-type-card__sub">Valores manuais ou colar lista</div>
                    </button>
                  )}
                </div>
              </div>

              {/* Prazo, Parcela Inicial, Início e Periodicidade (apenas na criação) */}
              {!isEdit && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
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
                    <label>Mês desta 1ª Parcela no App *</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      required
                    />
                  </div>
                  <div className="cp-field">
                    <label>Periodicidade das Parcelas</label>
                    <select value={intervaloMeses} onChange={(e) => setIntervaloMeses(e.target.value)}>
                      {INTERVALOS_OPCOES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Configuração do modo PROGRESSIVO */}
              {modoParcelamento === 'PROGRESSIVO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!isEdit && qtdRestante > 1 && (
                    <div className="cp-mode-pill-toggle">
                      <button
                        type="button"
                        className={progressivoInputMode === 'ULTIMA' ? 'is-active' : ''}
                        onClick={() => setProgressivoInputMode('ULTIMA')}
                      >
                        Informar última parcela
                      </button>
                      <button
                        type="button"
                        className={progressivoInputMode === 'VARIACAO' ? 'is-active' : ''}
                        onClick={() => setProgressivoInputMode('VARIACAO')}
                      >
                        Informar variação por parcela (R$)
                      </button>
                    </div>
                  )}

                  {progressivoInputMode === 'ULTIMA' || isEdit ? (
                    <div className="cp-field">
                      <label>Valor estimado da última parcela (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 678,00 (SAC) ou 700,00 (Taxa de Obra)"
                        value={valorUltimaParcela}
                        onChange={(e) => setValorUltimaParcela(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="cp-field">
                        <label>Variação por parcela (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: -6,50 (cai) ou 25,00 (sobe)"
                          value={variacaoMensal}
                          onChange={(e) => handleVariacaoMensalChange(e.target.value)}
                        />
                      </div>
                      <div className="cp-field">
                        <label>Última parcela calculada (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={valorUltimaParcela}
                          onChange={(e) => setValorUltimaParcela(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo ao vivo da curva / estimativa */}
              {!isEdit && resumoParcelamento && (
                <div className="cp-parcel-summary">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {resumoParcelamento.direcao === 'DECRESCENTE' && (
                      <span className="cp-parcel-badge cp-parcel-badge--down">
                        ↓ Decrescente (SAC)
                      </span>
                    )}
                    {resumoParcelamento.direcao === 'CRESCENTE' && (
                      <span className="cp-parcel-badge cp-parcel-badge--up">
                        ↑ Crescente (ex.: Taxa de Obra)
                      </span>
                    )}
                    {resumoParcelamento.direcao === 'FIXO' && (
                      <span className="cp-parcel-badge">Price / Fixo</span>
                    )}
                    {resumoParcelamento.direcao === 'CUSTOM' && (
                      <span className="cp-parcel-badge">
                        Personalizado ({resumoParcelamento.preenchidas}/{qtdRestante})
                      </span>
                    )}

                    {resumoParcelamento.valido && (
                      <span>
                        <strong>{formatarMoeda(resumoParcelamento.primeiro)}</strong>
                        {qtdRestante > 1 && (
                          <>
                            {' → '}
                            <strong>{formatarMoeda(resumoParcelamento.ultimo)}</strong>
                          </>
                        )}
                        {modoParcelamento === 'PROGRESSIVO' && qtdRestante > 1 && (
                          <span style={{ opacity: 0.75 }}>
                            {' '}
                            ({resumoParcelamento.variacaoMedia >= 0 ? '+' : ''}
                            {formatarMoeda(resumoParcelamento.variacaoMedia)}/parc.)
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {resumoParcelamento.totalEstimado > 0 && (
                    <div style={{ fontWeight: 700 }}>
                      Total ({qtdRestante}x): {formatarMoeda(resumoParcelamento.totalEstimado)}
                    </div>
                  )}
                </div>
              )}

              {/* Área de colar valores e editor parcela a parcela */}
              {!isEdit &&
                (modoParcelamento === 'PERSONALIZADO' ||
                  (qtdRestante <= 60 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="contas-pagar__btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => setMostrarPreviewParcelas((v) => !v)}
                      >
                        {mostrarPreviewParcelas ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {mostrarPreviewParcelas
                          ? 'Ocultar ajuste por parcela'
                          : `Pré-visualizar / ajustar exceções (${qtdRestante} parcelas)`}
                      </button>

                      {Object.keys(valoresCustom).length > 0 && (
                        <button
                          type="button"
                          className="contas-pagar__btn"
                          style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                          onClick={() => setValoresCustom({})}
                        >
                          <RotateCcw size={13} /> Limpar exceções ({Object.keys(valoresCustom).length})
                        </button>
                      )}
                    </div>
                  )))}

              {!isEdit && (modoParcelamento === 'PERSONALIZADO' || (mostrarPreviewParcelas && qtdRestante <= 60)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Colar lista rápida */}
                  <div className="cp-paste-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, opacity: 0.85 }}>
                        <ClipboardPaste size={13} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
                        Colar lista de valores (opcional)
                      </span>
                      <button
                        type="button"
                        className="contas-pagar__btn contas-pagar__btn--primary"
                        style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                        onClick={handleAplicarListaColada}
                      >
                        Aplicar lista
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Ex: 1950; 1950; 1334,70  ou  M001 684.86 ; M002 282.23 ; M003 679.47..."
                      value={textoColarValores}
                      onChange={(e) => setTextoColarValores(e.target.value)}
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--field-border, rgba(15, 23, 42, 0.18))',
                        background: 'var(--field-bg, #ffffff)',
                        color: 'var(--ink)',
                        fontSize: '0.8rem',
                        fontFamily: 'inherit',
                      }}
                    />
                    {colarFeedback && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--accent, #2563eb)', fontWeight: 600 }}>
                        {colarFeedback}
                      </div>
                    )}
                  </div>

                  {/* Lista editável de parcelas */}
                  {qtdRestante > 120 ? (
                    <div style={{ fontSize: '0.78rem', opacity: 0.8, padding: '6px 2px' }}>
                      Para séries longas ({qtdRestante} parcelas), recomendamos usar o modo{' '}
                      <strong>Fixo</strong> ou <strong>Progressivo</strong> (ou colar a lista acima).
                    </div>
                  ) : (
                    <div className="cp-parcel-list">
                      {Array.from({ length: qtdRestante }, (_, idx) => {
                        const numParc = parcelaInicialNum + idx
                        const mesTxt = formatarMesOffset(dataInicio, idx, intervaloNum)
                        const baseVal =
                          modoParcelamento === 'PROGRESSIVO' && isFinite(valorInicialNum) && isFinite(valorUltimaNum)
                            ? calcularValorProgressivo(valorInicialNum, valorUltimaNum, idx, qtdRestante)
                            : modoParcelamento === 'FIXO' && isFinite(valorInicialNum)
                            ? valorInicialNum
                            : null
                        const hasCustom = (valoresCustom[idx] || '').trim() !== ''
                        const displayVal = hasCustom
                          ? valoresCustom[idx]
                          : baseVal != null
                          ? baseVal.toFixed(2)
                          : ''

                        return (
                          <div
                            key={numParc}
                            className={`cp-parcel-row ${
                              modoParcelamento !== 'PERSONALIZADO' && hasCustom ? 'cp-parcel-row--custom' : ''
                            }`}
                          >
                            <div>
                              <div className="cp-parcel-row__label">
                                {numParc}/{totalParcelasNum}
                              </div>
                              {mesTxt && <div className="cp-parcel-row__month">{mesTxt}</div>}
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              value={displayVal}
                              onChange={(e) => {
                                const v = e.target.value
                                setValoresCustom((prev) => {
                                  const next = { ...prev }
                                  if (modoParcelamento !== 'PERSONALIZADO' && v.trim() === '') {
                                    delete next[idx]
                                  } else {
                                    next[idx] = v
                                  }
                                  return next
                                })
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Flag de valores estimados */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  paddingTop: '2px',
                }}
              >
                <input
                  type="checkbox"
                  checked={valoresEstimados}
                  onChange={(e) => {
                    setValoresEstimados(e.target.checked)
                    setValoresEstimadosTouched(true)
                  }}
                  style={{ marginTop: '3px' }}
                />
                <span>
                  <strong>Valores são estimados (confirmar boleto real todo mês)</strong>
                  <div style={{ fontSize: '0.73rem', opacity: 0.72 }}>
                    Ideal para Taxa de Obra, INCC ou TR: soma na projeção mensal e recalibra automaticamente as próximas parcelas conforme o histórico real de boletos pagos.
                  </div>
                </span>
              </label>
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
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--surface-subtle, #f8fafc)',
              border: '1px solid var(--border-strong, rgba(15, 23, 42, 0.14))',
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
              {tipo === 'PARCELADO' && modoParcelamento === 'PROGRESSIVO'
                ? 'Recalcular curva progressiva nas parcelas futuras ainda em aberto'
                : 'Aplicar novo valor padrão às ocorrências futuras ainda em aberto'}
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
