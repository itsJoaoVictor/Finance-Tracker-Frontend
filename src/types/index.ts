// Types para a aplicação

export interface Expense {
  id: number
  description: string
  amount: number
  category: string
  date: string
  notes?: string
}

export interface Category {
  id: string
  usuarioId: string | null
  nome: string
  icone: string
  corHexadecimal: string
  ativo: boolean
  criadoEm?: string
}

export interface CategoryCreateRequest {
  nome: string
  icone: string
  corHexadecimal: string
}

export interface CategoryUpdateRequest {
  nome: string
  icone: string
  corHexadecimal: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token?: string
  access_token?: string
  refresh_token?: string
  twoFactorRequired?: boolean
}

export type TipoConta = 'CORRENTE' | 'POUPANCA'

export interface Conta {
  id: string
  nome: string
  tipo: TipoConta
  saldo: number
  corHexadecimal?: string
  contaPadrao: boolean
  criadoEm?: string
}

export interface ContaCriacaoRequest {
  nome: string
  tipo: TipoConta
  saldo: number
  corHexadecimal?: string
  contaPadrao?: boolean
}

export interface ContaEdicaoRequest {
  nome: string
  tipo: TipoConta
  corHexadecimal?: string
  contaPadrao?: boolean
}

export interface ContaResumoResponse {
  totalSaldo: number
  quantidadeContas: number
}

export * from './cartoes'
export * from './transacoes'

