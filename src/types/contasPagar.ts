export type TipoContaPagar = 'VARIAVEL' | 'FIXO' | 'PARCELADO' | 'AVULSO'
export type StatusOcorrencia = 'AGUARDANDO_VALOR' | 'PENDENTE' | 'PAGA' | 'CANCELADA'
export type StatusEfetivoOcorrencia = StatusOcorrencia | 'ATRASADA'

export interface ContaPagarModelo {
  id: string
  nome: string
  tipo: TipoContaPagar
  categoriaId: string
  categoriaNome: string
  categoriaIcone?: string
  categoriaCor?: string
  agrupador?: string | null
  diaVencimento: number
  valorPadrao?: number | null
  totalParcelas?: number | null
  parcelaInicial?: number | null
  dataInicio: string
  dataFim?: string | null
  debitoAutomatico: boolean
  contaPadraoId?: string | null
  contaPadraoNome?: string | null
  ativo: boolean
}

export interface ContaPagarModeloCriacaoRequest {
  nome: string
  tipo: TipoContaPagar
  categoriaId: string
  agrupador?: string | null
  diaVencimento: number
  valorPadrao?: number | null
  totalParcelas?: number | null
  parcelaInicial?: number | null
  dataInicio: string
  dataFim?: string | null
  debitoAutomatico?: boolean
  contaPadraoId?: string | null
  linhaDigitavel?: string | null
  observacao?: string | null
}

export interface ContaPagarModeloEdicaoRequest {
  nome: string
  categoriaId: string
  agrupador?: string | null
  diaVencimento: number
  valorPadrao?: number | null
  dataFim?: string | null
  debitoAutomatico?: boolean
  contaPadraoId?: string | null
  aplicarValorOcorrenciasFuturas?: boolean
}

export interface ContaPagarOcorrencia {
  id: string
  modeloId: string
  modeloNome: string
  modeloTipo: TipoContaPagar
  agrupador?: string | null
  categoriaId: string
  categoriaNome: string
  categoriaIcone?: string
  categoriaCor?: string
  debitoAutomatico: boolean
  contaPadraoId?: string | null
  mesReferencia: string
  numeroParcela?: number | null
  totalParcelas?: number | null
  dataVencimento: string
  valorEstimado?: number | null
  valorReal?: number | null
  valorPago?: number | null
  valorEfetivo: number
  jurosMulta: number
  dataPagamento?: string | null
  status: StatusOcorrencia
  statusEfetivo: StatusEfetivoOcorrencia
  atrasada: boolean
  linhaDigitavel?: string | null
  observacao?: string | null
  transacaoId?: string | null
}

export interface AtualizarOcorrenciaRequest {
  valorReal?: number | null
  valorEstimado?: number | null
  dataVencimento?: string | null
  linhaDigitavel?: string | null
  observacao?: string | null
}

export interface PagarOcorrenciaRequest {
  meio: 'CONTA' | 'CARTAO'
  contaId?: string | null
  cartaoId?: string | null
  dataPagamento: string
  valorPago: number
  linhaDigitavel?: string | null
  observacao?: string | null
}

export interface GradeMensalResponse {
  meses: string[]
  agrupadores: string[]
  linhas: {
    modelo: ContaPagarModelo
    celulas: (ContaPagarOcorrencia | null)[]
  }[]
  totaisPorMes: {
    mesReferencia: string
    totalPago: number
    totalPendente: number
    totalEstimado: number
    totalGeral: number
  }[]
  totalJurosAno: number
}

export interface AmortizarRequest {
  valor: number
  data: string
  origem: 'CONTA' | 'EXTERNA'
  contaId?: string | null
  modo: 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'
  parcelasEliminadas?: number | null
  novoValorParcela?: number | null
  observacao?: string | null
}

export interface FinanciamentoDetalheResponse {
  modelo: ContaPagarModelo
  parcelasPagas: number
  parcelasRestantes: number
  parcelasCanceladas: number
  totalPagoParcelas: number
  totalPagoAmortizacoes: number
  totalGeralPago: number
  totalJurosMultaPago: number
  totalRestanteEstimado: number
  ocorrencias: ContaPagarOcorrencia[]
  amortizacoes: {
    id: string
    valor: number
    data: string
    origem: 'CONTA' | 'EXTERNA'
    contaNome: string
    modo: 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'
    parcelasEliminadas?: number | null
    novoValorParcela?: number | null
    observacao?: string | null
    transacaoId?: string | null
  }[]
}

export interface NotificacaoConfig {
  telegramChatId: string
  telegramAtivo: boolean
  webPushAtivo: boolean
  telegramBotConfiguradoNoServidor: boolean
  vapidPublicKey: string
}
