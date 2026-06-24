import api from './api'

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

export const iaService = {
  categorizar: (descricaoFatura: string) => 
    api.post<IaCategorizarResponse>('/api/ia/categorizar', { descricaoFatura }),
  
  getInsights: () => 
    api.get<IaInsight[]>('/api/ia/insights'),
  
  marcarComoLido: (id: string) => 
    api.put<void>(`/api/ia/insights/${id}/ler`),
  
  enviarFeedback: (id: string, relevante: boolean) => 
    api.post<void>(`/api/ia/insights/${id}/feedback`, { relevante }),

  processarInsights: () =>
    api.post<{ message: string }>('/api/ia/insights/processar'),

  processarInsightsCartao: () =>
    api.post<{ message: string }>('/api/ia/insights/processar/cartao'),

  processarInsightsAssinatura: () =>
    api.post<{ message: string }>('/api/ia/insights/processar/assinatura')
}
