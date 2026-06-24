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

