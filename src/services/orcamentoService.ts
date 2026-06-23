import api from './api'
import { Orcamento, OrcamentoCriacaoRequest, OrcamentoResumo } from '../types'

export const orcamentoService = {
  criarOuAtualizar: (payload: OrcamentoCriacaoRequest) => api.post<Orcamento>('/api/orcamentos', payload),
  resumo: () => api.get<OrcamentoResumo[]>('/api/orcamentos/resumo'),
}
