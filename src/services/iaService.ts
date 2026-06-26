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
    api.post<{ message: string }>('/api/ia/otimizacao-parcelamento'),
}
