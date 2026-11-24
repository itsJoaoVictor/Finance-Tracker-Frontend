export type TipoContaPagar = 'VARIAVEL' | 'FIXO' | 'PARCELADO' | 'AVULSO'
export type ModoParcelamento = 'FIXO' | 'PROGRESSIVO' | 'PERSONALIZADO'
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
  financiamentoId?: string | null
  financiamentoNome?: string | null
  diaVencimento: number
  valorPadrao?: number | null
  modoParcelamento?: ModoParcelamento
  valorUltimaParcela?: number | null
  intervaloMeses?: number
  valoresEstimados?: boolean
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
  financiamentoId?: string | null
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
  modoParcelamento?: ModoParcelamento
  valorUltimaParcela?: number | null
  intervaloMeses?: number | null
  valoresEstimados?: boolean
  valoresParcelas?: (number | null)[] | null
}

export interface ContaPagarModeloEdicaoRequest {
  nome: string
  categoriaId: string
  agrupador?: string | null
  financiamentoId?: string | null
  diaVencimento: number
  valorPadrao?: number | null
  dataFim?: string | null
  debitoAutomatico?: boolean
  contaPadraoId?: string | null
  aplicarValorOcorrenciasFuturas?: boolean
  modoParcelamento?: ModoParcelamento
  valorUltimaParcela?: number | null
  valoresEstimados?: boolean
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

export type DirecaoAbatimento = 'ULTIMAS' | 'PROXIMAS'

export interface AmortizarRequest {
  valor: number
  data: string
  origem: 'CONTA' | 'EXTERNA'
  contaId?: string | null
  modo: 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'
  parcelasEliminadas?: number | null
  novoValorParcela?: number | null
  observacao?: string | null
  direcaoAbatimento?: DirecaoAbatimento
  descontoObtido?: number | null
  novoValorUltimaParcela?: number | null
}

export interface AjustarPrazoRequest {
  acao: 'ENCERRAR' | 'REDUZIR' | 'ESTENDER'
  quantidadeParcelas?: number | null
  valorParcelasAdicionadas?: number | null
  motivo?: string | null
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
  totalDescontoObtido: number
  totalRestanteEstimado: number
  concluido: boolean
  ocorrencias: ContaPagarOcorrencia[]
  amortizacoes: {
    id: string
    valor: number
    data: string
    origem: 'CONTA' | 'EXTERNA'
    contaNome: string
    modo: 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'
    direcaoAbatimento?: DirecaoAbatimento
    parcelasEliminadas?: number | null
    novoValorParcela?: number | null
    valorOriginalAbatido?: number | null
    descontoObtido?: number | null
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

export interface FinanciamentoRequest {
  nome: string
  descricao?: string | null
  corHexadecimal?: string | null
  valorPagoAnteriormente?: number | null
  valorContratado?: number | null
}

export interface ModeloVinculadoResumo {
  id: string
  nome: string
  tipo: TipoContaPagar
  modoParcelamento: ModoParcelamento
  intervaloMeses: number
  valoresEstimados: boolean
  diaVencimento: number
  valorPadrao?: number | null
  valorUltimaParcela?: number | null
  totalParcelas?: number | null
  parcelasPagas: number
  parcelasRestantes: number
  totalPago: number
  totalAmortizacoes: number
  totalDescontoObtido: number
  totalRestante: number
  valorTotal: number
  concluido: boolean
}

export interface TransacaoVinculadaItem {
  vinculoId: string
  transacaoId: string
  descricao: string
  valor: number
  data: string
  tipo: string
  categoriaNome?: string | null
  observacao?: string | null
}

export interface FinanciamentoResumo {
  id: string
  nome: string
  descricao?: string | null
  corHexadecimal?: string | null
  valorPagoAnteriormente: number
  totalPagoModelos: number
  totalPagoAmortizacoes: number
  totalPagoTransacoesSoltas: number
  totalPago: number
  totalRestante: number
  valorTotal: number
  valorContratado?: number | null
  jurosEncargosProjetados?: number | null
  percentualJurosProjetados?: number | null
  totalDescontoObtido: number
  percentualPago: number
  concluido: boolean
  qtdModelosVinculados: number
  qtdTransacoesVinculadas: number
  modelos: ModeloVinculadoResumo[]
  transacoesVinculadas: TransacaoVinculadaItem[]
}

export interface ItensDisponiveisVinculo {
  modelosDisponiveis: {
    id: string
    nome: string
    tipo: TipoContaPagar
    agrupador?: string | null
    totalParcelas?: number | null
    parcelasPagas: number
    parcelasRestantes: number
    totalPago: number
    totalRestante: number
  }[]
  transacoesDisponiveis: {
    id: string
    descricao: string
    valor: number
    data: string
    tipo: string
    categoriaNome?: string | null
  }[]
}

export interface VincularItensFinanciamentoRequest {
  modeloIds?: string[]
  transacaoIds?: string[]
}
