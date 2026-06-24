export type TipoTransacao = 'DEPOSITO' | 'SAQUE' | 'TRANSFERENCIA' | 'PIX' | 'COMPRA_CREDITO' | 'PAGAMENTO_CREDITO'
export type TipoPagamentoFatura = 'TOTAL' | 'PARCIAL' | 'ANTECIPADO'
export type StatusFatura = 'ABERTA' | 'FECHADA' | 'PAGA' | 'PAGA_PARCIAL' | 'ATRASADA'
export type Recorrencia = 'MENSAL' | 'SEMANAL' | 'QUINZENAL'
export type TipoRecorrencia = 'MENSAL' | 'ANUAL' | 'TRIMESTRAL' | 'PERSONALIZADO'
export type UnidadeFrequencia = 'SEMANAS' | 'MESES' | 'ANOS'

export interface Transacao {
  id: string
  descricao: string
  valor: number
  tipo: TipoTransacao
  contaOrigemId?: string
  contaDestinoId?: string
  contaOrigemNome?: string
  contaDestinoNome?: string
  cartaoId?: string
  faturaId?: string
  categoriaId?: string
  categoriaNome?: string
  data: string
  numeroParcela?: number
  totalParcelas?: number
  tipoPagamentoFatura?: TipoPagamentoFatura
  estornada: boolean
  tagIds?: string[]
  alertaOrcamento?: {
    atingido: boolean
    percentual: number
    limite: number
    consumido: number
  }
  criadoEm?: string
}

export interface TransacaoCriacaoRequest {
  descricao: string
  valor: number
  tipo: TipoTransacao
  contaOrigemId?: string
  contaDestinoId?: string
  cartaoId?: string
  categoriaId?: string
  data: string
  totalParcelas?: number
  tagIds?: string[]
  metaOrigemId?: string
  metaDestinoId?: string
}

export interface TransferenciaRequest {
  contaOrigemId: string
  contaDestinoId: string
  valor: number
  descricao?: string
  categoriaId?: string
}

export interface PagamentoFaturaRequest {
  faturaId: string
  contaOrigemId: string
  valor: number
  tipoPagamento: TipoPagamentoFatura
}

export interface EstornoRequest {
  transacaoId: string
  valor?: number
}

// Tags
export interface Tag {
  id: string
  nome: string
  corHexadecimal: string
  criadoEm?: string
}

export interface TagCriacaoRequest {
  nome: string
  corHexadecimal: string
}

// Agendamentos
export interface Agendamento {
  id: string
  descricao: string
  valor: number
  tipo: TipoTransacao
  contaOrigemId?: string
  contaDestinoId?: string
  categoriaId: string
  recorrencia: Recorrencia
  diaExecucao: number
  dataInicio: string
  dataProximaExecucao: string
  ativo: boolean
  criadoEm?: string
}

export interface AgendamentoCriacaoRequest {
  descricao: string
  valor: number
  tipo: TipoTransacao
  contaOrigemId?: string
  contaDestinoId?: string
  categoriaId: string
  recorrencia: Recorrencia
  diaExecucao: number
  dataInicio: string
}

// Orçamentos
export interface Orcamento {
  id: string
  categoriaId: string
  limiteMensal?: number
  mesReferencia: string
}

export interface OrcamentoCriacaoRequest {
  categoriaId: string
  limiteMensal?: number
  mesReferencia: string
}

export interface OrcamentoResumo {
  categoriaId: string
  categoriaNome: string
  limiteMensal: number
  totalGasto: number
}

// Metas de Economia (Cofrinhos)
export interface MetaEconomia {
  id: string
  nome: string
  valorAlvo: number
  valorAcumulado: number
  contaVinculadaId: string
  criadoEm?: string
}

export interface MetaEconomiaCriacaoRequest {
  nome: string
  valorAlvo: number
  contaVinculadaId: string
}

// Assinaturas
export interface Assinatura {
  id: string
  nome: string
  valor: number
  cartaoId: string
  categoriaId: string
  tipoRecorrencia: TipoRecorrencia
  frequencia?: number
  unidadeFrequencia?: UnidadeFrequencia
  diaCobranca: number
  dataInicio: string
  dataProximaCobranca: string
  ativo: boolean
  criadoEm?: string
}

export interface AssinaturaCriacaoRequest {
  nome: string
  valor: number
  cartaoId: string
  categoriaId: string
  tipoRecorrencia: TipoRecorrencia
  frequencia?: number
  unidadeFrequencia?: UnidadeFrequencia
  diaCobranca: number
  dataInicio: string
  ativo?: boolean
}

export interface AssinaturaEdicaoRequest {
  nome: string
  valor: number
  cartaoId: string
  categoriaId: string
  tipoRecorrencia: TipoRecorrencia
  frequencia?: number
  unidadeFrequencia?: UnidadeFrequencia
  diaCobranca: number
  dataInicio: string
  ativo?: boolean
}

export interface AssinaturaProxima {
  id: string
  nome: string
  valor: number
  cartaoId: string
  dataProximaCobranca: string
  diasRestantes: number
}

// Sugestão
export interface SugestaoResponse {
  categoriaId?: string
  categoriaNome?: string
  tagIds?: string[]
  tags?: { id: string; nome: string; corHexadecimal: string }[]
}

// Projeção
export interface Projecao {
  data: string
  saldoProjetado: number
}