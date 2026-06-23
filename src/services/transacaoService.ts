import api from './api'
import {
  Transacao, TransacaoCriacaoRequest, TransferenciaRequest,
  PagamentoFaturaRequest, EstornoRequest, SugestaoResponse, Projecao
} from '../types'

export const transacaoService = {
  getAll: () => api.get<Transacao[]>('/api/transacoes'),
  create: (payload: TransacaoCriacaoRequest) => api.post<Transacao>('/api/transacoes', payload),
  transferir: (payload: TransferenciaRequest) => api.post<Transacao>('/api/transacoes/transferir', payload),
  pagarFatura: (payload: PagamentoFaturaRequest) => api.post<Transacao>('/api/transacoes/pagar-fatura', payload),
  estornar: (id: string, payload: EstornoRequest) => api.post<Transacao>(`/api/transacoes/${id}/estornar`, payload),
  excluir: (id: string) => api.delete(`/api/transacoes/${id}`),
  sugerir: (descricao: string) => api.get<SugestaoResponse>(`/api/transacoes/sugestao?descricao=${encodeURIComponent(descricao)}`),
  projetar: (dias: number = 30) => api.get<Projecao[]>(`/api/transacoes/projecao?dias=${dias}`),
}
