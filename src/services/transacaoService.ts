import api from './api'
import {
  Transacao, TransacaoCriacaoRequest, TransferenciaRequest,
  PagamentoFaturaRequest, EstornoRequest, AnteciparParcelasRequest, SugestaoResponse, Projecao
} from '../types'

export const transacaoService = {
  getAll: (params?: {
    tipo?: string
    descricao?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    size?: number
  }) => api.get<{
    content: Transacao[]
    totalPages: number
    totalElements: number
    number: number
    size: number
  }>('/api/transacoes', { params }),
  create: (payload: TransacaoCriacaoRequest) => api.post<Transacao>('/api/transacoes', payload),
  transferir: (payload: TransferenciaRequest) => api.post<Transacao>('/api/transacoes/transferir', payload),
  pagarFatura: (payload: PagamentoFaturaRequest) => api.post<Transacao>('/api/transacoes/pagar-fatura', payload),
  estornar: (id: string, payload: EstornoRequest) => api.post<Transacao>(`/api/transacoes/${id}/estornar`, payload),
  anteciparParcelas: (id: string, payload: AnteciparParcelasRequest) => api.post<Transacao>(`/api/transacoes/${id}/antecipar-parcelas`, payload),
  excluir: (id: string) => api.delete(`/api/transacoes/${id}`),
  sugerir: (descricao: string) => api.get<SugestaoResponse>(`/api/transacoes/sugestao?descricao=${encodeURIComponent(descricao)}`),
  projetar: (dias: number = 30) => api.get<Projecao[]>(`/api/transacoes/projecao?dias=${dias}`),
  getByFatura: (faturaId: string) => api.get<Transacao[]>(`/api/transacoes/fatura/${faturaId}`),
}
