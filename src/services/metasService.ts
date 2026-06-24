import api from './api'
import { MetaEconomia, MetaEconomiaCriacaoRequest } from '../types'

export const metasService = {
  getAll: () => api.get<MetaEconomia[]>('/api/metas'),
  create: (payload: MetaEconomiaCriacaoRequest) => api.post<MetaEconomia>('/api/metas', payload),
  depositar: (id: string, valor: number, contaOrigemId: string) =>
    api.post<MetaEconomia>(`/api/metas/${id}/deposito`, { valor, contaOrigemId }),
  resgatar: (id: string, valor: number, contaDestinoId: string) =>
    api.post<MetaEconomia>(`/api/metas/${id}/resgate`, { valor, contaDestinoId }),
  excluir: (id: string) => api.delete(`/api/metas/${id}`),
}
