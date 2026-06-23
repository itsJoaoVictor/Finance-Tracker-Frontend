import api from './api'
import { Assinatura, AssinaturaCriacaoRequest, AssinaturaEdicaoRequest, AssinaturaProxima } from '../types'

export const assinaturaService = {
  getAll: () => api.get<Assinatura[]>('/api/assinaturas'),
  getById: (id: string) => api.get<Assinatura>(`/api/assinaturas/${id}`),
  getProximas: (dias: number = 7) => api.get<AssinaturaProxima[]>(`/api/assinaturas/proximas?dias=${dias}`),
  create: (payload: AssinaturaCriacaoRequest) => api.post<Assinatura>('/api/assinaturas', payload),
  update: (id: string, payload: AssinaturaEdicaoRequest) => api.put<Assinatura>(`/api/assinaturas/${id}`, payload),
  excluir: (id: string) => api.delete(`/api/assinaturas/${id}`),
  pausar: (id: string) => api.post(`/api/assinaturas/${id}/pausar`),
  reativar: (id: string) => api.post(`/api/assinaturas/${id}/reativar`),
}
