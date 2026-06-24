import api from './api'
import { Orcamento, OrcamentoCriacaoRequest, OrcamentoResumo } from '../types'

export const orcamentoService = {
  criarOuAtualizar: (payload: OrcamentoCriacaoRequest) => api.post<Orcamento>('/api/orcamentos', payload),
  editar: (id: string, payload: OrcamentoCriacaoRequest) => api.put<Orcamento>(`/api/orcamentos/${id}`, payload),
  excluir: (id: string) => api.delete(`/api/orcamentos/${id}`),
  resumo: () => api.get<OrcamentoResumo[]>('/api/orcamentos/resumo'),
}
