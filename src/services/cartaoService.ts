import api from './api'
import {
  Cartao,
  CartaoCriacaoRequest,
  CartaoEdicaoRequest,
  CartaoResumoResponse,
  Fatura,
  FaturaVencimentoRequest
} from '../types/cartoes'

export const cartaoService = {
  getAll: () => api.get<Cartao[]>('/api/cartoes'),
  getById: (id: string) => api.get<Cartao>(`/api/cartoes/${id}`),
  getResumo: () => api.get<CartaoResumoResponse>('/api/cartoes/resumo'),
  getFaturas: (id: string) => api.get<Fatura[]>(`/api/cartoes/${id}/faturas`),
  ajustarVencimentoFatura: (
    cartaoId: string,
    faturaId: string,
    payload: FaturaVencimentoRequest
  ) => api.patch<Fatura>(`/api/cartoes/${cartaoId}/faturas/${faturaId}/vencimento`, payload),
  create: (payload: CartaoCriacaoRequest) => api.post<Cartao>('/api/cartoes', payload),
  update: (id: string, payload: CartaoEdicaoRequest) => api.put<Cartao>(`/api/cartoes/${id}`, payload),
  softDelete: (id: string) => api.delete(`/api/cartoes/${id}`),
}
