export interface DashboardResumo {
  preferenciasLayout: {
    ordemWidgets: string[]
    widgetsOcultos: string[]
  }
  kpis: {
    saldoTotal: number
    faturaTotalCartoes: number
    limiteTotalDisponivelCartoes: number
  }
  projetcao15Dias: {
    saldoProjetado: number
    status: string
    mensagem: string
  }
  contas: ContaDashboard[]
  cartoes: CartaoDashboard[]
  ultimasTransacoes: TransacaoDashboard[]
  insightsAtivos: InsightDashboard[]
  contasPagar: ContasPagarDashboard
}

export interface ContasPagarDashboard {
  totalPagoMes: number
  totalPendenteMes: number
  totalEstimadoMes: number
  totalAtrasado: number
  qtdAtrasadas: number
  qtdVencendo7Dias: number
  proximasOuAtrasadas: {
    ocorrenciaId: string
    modeloId: string
    nome: string
    agrupador?: string | null
    tipo: string
    dataVencimento: string
    valorEfetivo: number
    valorEstimado: boolean
    statusEfetivo: string
    numeroParcela?: number | null
    totalParcelas?: number | null
  }[]
}

export interface ContaDashboard {
  id: string
  nome: string
  tipo: string
  saldo: number
  corHexadecimal: string
}

export interface CartaoDashboard {
  id: string
  nome: string
  faturaAtual: number
  limiteDisponivel: number
  corHexadecimal: string
}

export interface TransacaoDashboard {
  id: string
  descricao: string
  valor: number
  tipo: string
  categoriaNome: string | null
  categoriaIcone: string | null
  categoriaCorHexadecimal: string | null
  data: string
}

export interface InsightDashboard {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  criadoEm: string
}

export interface LayoutRequest {
  ordemWidgets: string[]
  widgetsOcultos: string[]
}