import api from './api'
import { ProjecaoCartoesResponse } from '../types/cartoes'

export interface IaCategorizarResponse {
  categoriaSugerida: string
  categoriaId?: string
  confianca: number
  justificativa: string
}

export interface IaInsight {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  criadoEm: string
  lido: boolean
  relevante?: boolean
  metadados?: string
}

export interface IaSimulacaoParcela {
  impactoNegativo: boolean
  mensagem: string
  valorParcela: number
  percentualDoLimite: number
  limiteDisponivel: number
  projecoesMensais: {
    mes: string
    valorJaNaFatura: number
    valorParcela: number
    valorComParcela: number
  }[]
}

export const iaService = {
  // RN-07 / RN-12: Categorização PLN
  categorizar: (descricaoFatura: string) =>
    api.post<IaCategorizarResponse>('/api/ia/categorizar', { descricaoFatura }),

  // RN-14: Feedback Loop — registrar correção manual de categoria
  registrarCorrecao: (descricaoFatura: string, categoriaNovaId: string, categoriaAntigaId?: string) =>
    api.post<{ success: boolean; message: string }>('/api/ia/correcao', {
      descricaoFatura,
      categoriaNovaId,
      categoriaAntigaId,
    }),

  // Insights
  getInsights: () =>
    api.get<IaInsight[]>('/api/ia/insights'),

  marcarComoLido: (id: string) =>
    api.put<void>(`/api/ia/insights/${id}/ler`),

  enviarFeedback: (id: string, relevante: boolean) =>
    api.post<void>(`/api/ia/insights/${id}/feedback`, { relevante }),

  // Disparo manual de análise
  processarInsights: () =>
    api.post<{ message: string }>('/api/ia/insights/processar'),

  processarInsightsCartao: () =>
    api.post<{ message: string }>('/api/ia/insights/processar/cartao'),

  processarInsightsAssinatura: () =>
    api.post<{ message: string }>('/api/ia/insights/processar/assinatura'),

  // RN-03: Simulação de compra parcelada
  simularParcela: (cartaoId: string, valorTotal: number, parcelas: number) =>
    api.post<IaSimulacaoParcela>('/api/ia/simular-parcela', { cartaoId, valorTotal, parcelas }),

  // Projeção de Faturas (endpoint dedicado)
  getProjecaoCartoes: () =>
    api.post<ProjecaoCartoesResponse>('/api/ia/projecao-cartoes'),

  // Aviso de Fechamento Iminente (endpoint dedicado)
  verificarAvisosFechamento: () =>
    api.post<{ message: string }>('/api/ia/aviso-fechamento'),

  // Melhor Cartão para o Momento (endpoint dedicado)
  verificarMelhorCartao: () =>
    api.post<{ message: string }>('/api/ia/melhor-cartao'),

  // Todos os insights de cartão (chamada atômica única)
  processarTodosInsightsCartao: () =>
    api.post<{ message: string }>('/api/ia/insights/cartao'),

  // Concentração de Gastos na Fatura (Category Spike)
  verificarConcentracaoGastos: () =>
    api.post<{ message: string }>('/api/ia/concentracao-gastos-fatura'),

  // Otimização de Parcelamentos Futuros (Folga de Limite)
  verificarOtimizacaoParcelamento: () =>
    api.post<FolgaLimiteResponse>('/api/ia/otimizacao-parcelamento'),

  // Análise de Fadiga de Assinatura (dedicada)
  getFadigaAssinatura: () =>
    api.post<FadigaAssinaturaResponse>('/api/ia/fadiga-assinatura'),

  // Central de Inteligência: reajuste + score (chamada atômica única)
  getInteligenciaAssinatura: () =>
    api.post<InteligenciaAssinaturaResponse>('/api/ia/assinaturas/inteligencia'),

  // Classificação de Assinaturas — perguntas pendentes da IA
  getPendentesConfirmacao: () =>
    api.get<PendenteConfirmacao[]>('/api/ia/assinaturas/pendentes-confirmacao'),

  confirmarClassificacao: (assinaturaId: string, essencialidade: string) =>
    api.post<{ success: boolean }>('/api/ia/assinaturas/confirmar-classificacao', {
      assinaturaId,
      essencialidade,
    }),

  // Classificação comportamental — como o usuário usa a assinatura
  classificarComportamento: (assinaturaId: string, perfil: string) =>
    api.post<{ success: boolean }>('/api/ia/assinaturas/classificar-comportamento', {
      assinaturaId,
      perfil,
    }),

  // Efeito Dominó: Prevenção de Falha de Cobrança (dedicada)
  getEfeitoDominio: () =>
    api.post<DominioEfeitoDominoResponse>('/api/ia/efeito-dominio'),
}

export interface PendenteConfirmacao {
  assinaturaId: string
  nome: string
  categoria: string
  valorMensal: number
  essencialidade: string
  justificativa: string
}

// ── Central de Inteligência de Assinaturas ──────────────────────────

export interface InteligenciaAssinaturaResponse {
  reajustes: ReajusteDetectado[]
}

export interface ReajusteDetectado {
  assinaturaId: string
  nome: string
  categoria: string
  valorAnterior: number
  valorAtual: number
  percentualAumento: number
  impactoAnual: number
  alteracaoVoluntaria: boolean
}

export interface FadigaAssinaturaResponse {
  totalAssinaturas: number
  totalEssenciais: number
  totalImportantes: number
  totalDiscricionarias: number
  totalGeral: number
  indiceAssinaturas: number
  indiceNaoEssencial: number
  classificacaoGlobal: string
  nivelAlerta: string
  itens: {
    nome: string
    categoria: string
    valorMensal: number
    essencialidade: string
    nivelEmoji: string
  }[]
  duplicadasPorCategoria: Record<string, number>
  servicosSemelhantes: string[]
  mensagem: string
}

// ── Efeito Dominó: Prevenção de Falha de Cobrança ──────────────────

export interface DominioEfeitoDominoResponse {
  alertas: AlertaCartao[]
  mensagem: string
}

export interface AlertaCartao {
  cartaoId: string
  cartaoNome: string
  limiteDisponivel: number
  totalCobranca: number
  diasRestantes: number
  essenciaisAfetadas: number
  importantesAfetadas: number
  opcionaisAfetadas: number
  nivelAlerta: string
  ranking: ItemRanking[]
  recomendacoes: string[]
}

export interface ItemRanking {
  assinaturaId: string
  nome: string
  valor: number
  essencialidade: string
  dataCobranca: string
  falha: boolean
}

// ── Otimização de Parcelamento (Folga de Limite) ──────────────────────

export interface FolgaLimiteResponse {
  items: FolgaLimiteItem[]
}

export interface FolgaLimiteItem {
  id: string
  cartaoId: string
  cartaoNome: string
  descricao: string
  valorParcela: number
  totalParcelas: number
  impactoMensal: number
  titulo: string
  mensagem: string
}

