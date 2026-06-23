import api from './api'
import { Agendamento, AgendamentoCriacaoRequest } from '../types'

export const agendamentoService = {
  getAll: () => api.get<Agendamento[]>('/api/agendamentos'),
  create: (payload: AgendamentoCriacaoRequest) => api.post<Agendamento>('/api/agendamentos', payload),
  excluir: (id: string) => api.delete(`/api/agendamentos/${id}`),
}
