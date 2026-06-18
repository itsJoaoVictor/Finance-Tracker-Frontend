import api from './api'
import { Conta, ContaCriacaoRequest, ContaEdicaoRequest, ContaResumoResponse } from '../types'

export const contaService = {
  getAll: () => api.get<Conta[]>('/api/contas'),
  getById: (id: string) => api.get<Conta>(`/api/contas/${id}`),
  getResumo: () => api.get<ContaResumoResponse>('/api/contas/resumo'),
  create: (payload: ContaCriacaoRequest) => api.post<Conta>('/api/contas', payload),
  update: (id: string, payload: ContaEdicaoRequest) => api.put<Conta>(`/api/contas/${id}`, payload),
  softDelete: (id: string) => api.delete(`/api/contas/${id}`),
}
