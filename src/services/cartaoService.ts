import api from './api'
import { Cartao, CartaoCriacaoRequest, CartaoEdicaoRequest, CartaoResumoResponse, Fatura } from '../types/cartoes'

export const cartaoService = {
  getAll: () => api.get<Cartao[]>('/api/cartoes'),
  getById: (id: string) => api.get<Cartao>(`/api/cartoes/${id}`),
  getResumo: () => api.get<CartaoResumoResponse>('/api/cartoes/resumo'),
  getFaturas: (id: string) => api.get<Fatura[]>(`/api/cartoes/${id}/faturas`),
  create: (payload: CartaoCriacaoRequest) => api.post<Cartao>('/api/cartoes', payload),
  update: (id: string, payload: CartaoEdicaoRequest) => api.put<Cartao>(`/api/cartoes/${id}`, payload),
  softDelete: (id: string) => api.delete(`/api/cartoes/${id}`),
}
