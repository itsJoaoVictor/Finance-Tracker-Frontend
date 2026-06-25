import { StatusFatura } from './transacoes'

export interface Cartao {
  id: string
  nome: string
  limite: number
  limiteDisponivel: number
  diaFechamento: number
  diaVencimento: number
  contaId: string
  corHexadecimal?: string
  criadoEm?: string
  faturaEstimada?: number
  faturaStatus?: 'ABERTA' | 'FECHADA'
  faturaMesReferencia?: string
}

export interface CartaoCriacaoRequest {
  nome: string
  limite: number
  diaFechamento: number
  diaVencimento: number
  contaId: string
  corHexadecimal?: string
}

export interface CartaoEdicaoRequest {
  nome: string
  limite: number
  diaFechamento: number
  diaVencimento: number
  contaId: string
  corHexadecimal?: string
}

export interface CartaoResumoResponse {
  totalLimite: number
  totalLimiteDisponivel: number
  totalFaturaEstimada: number
  quantidadeCartoes: number
}

export interface Fatura {
  id: string
  mesReferencia: string
  dataFechamento: string
  dataVencimento: string
  valorTotal: number
  valorPago: number
  status: StatusFatura
  rolladoOver?: boolean
}

// ── Projeção de Faturas (IA dedicada) ────────────────────────────────

export type ClassificacaoFatura = 'ACIMA' | 'ABAIXO' | 'DENTRO' | 'SEM_DADOS' | 'NOVO' | 'PRIMEIRO_MES'

export interface ProjecaoCartao {
  cartaoId: string
  cartaoNome: string
  corHexadecimal?: string
  statusFatura: 'ABERTA' | 'FECHADA' | 'SEM_FATURA'
  valorAtualNoMes: number
  projecaoFechamento: number
  projecaoViaIa: boolean
  valorRealFechado?: number
  mediaHistorica?: number
  mesesHistorico?: number
  desvioPercentual?: number
  classificacao: ClassificacaoFatura
  mensagemResumo: string
  diasNoMes: number
  diasPassados: number
}

export interface ProjecaoCartoesResponse {
  projecoes: ProjecaoCartao[]
  totalCartoes: number
  dadosInsuficientes: boolean
}

