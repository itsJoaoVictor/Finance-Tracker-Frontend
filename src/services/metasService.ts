import api from './api'
import { MetaEconomia, MetaEconomiaCriacaoRequest } from '../types'

export const metasService = {
  getAll: () => api.get<MetaEconomia[]>('/api/metas'),
  create: (payload: MetaEconomiaCriacaoRequest) => api.post<MetaEconomia>('/api/metas', payload),
  excluir: (id: string) => api.delete(`/api/metas/${id}`),
}
