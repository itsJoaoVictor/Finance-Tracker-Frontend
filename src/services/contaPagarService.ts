import api from './api'
import {
  AmortizarRequest,
  AtualizarOcorrenciaRequest,
  ContaPagarModelo,
  ContaPagarModeloCriacaoRequest,
  ContaPagarModeloEdicaoRequest,
  ContaPagarOcorrencia,
  FinanciamentoDetalheResponse,
  GradeMensalResponse,
  NotificacaoConfig,
  PagarOcorrenciaRequest,
} from '../types/contasPagar'

export const contaPagarService = {
  listarModelos: () => api.get<ContaPagarModelo[]>('/api/contas-pagar/modelos'),

  criarModelo: (payload: ContaPagarModeloCriacaoRequest) =>
    api.post<ContaPagarModelo>('/api/contas-pagar/modelos', payload),

  editarModelo: (id: string, payload: ContaPagarModeloEdicaoRequest) =>
    api.put<ContaPagarModelo>(`/api/contas-pagar/modelos/${id}`, payload),

  excluirModelo: (id: string) => api.delete<void>(`/api/contas-pagar/modelos/${id}`),

  obterGrade: (params?: { mesInicio?: string; mesFim?: string; agrupador?: string }) =>
    api.get<GradeMensalResponse>('/api/contas-pagar/grade', { params }),

  listarOcorrenciasMes: (params?: { mes?: string; agrupador?: string }) =>
    api.get<ContaPagarOcorrencia[]>('/api/contas-pagar/ocorrencias', { params }),

  atualizarOcorrencia: (id: string, payload: AtualizarOcorrenciaRequest) =>
    api.put<ContaPagarOcorrencia>(`/api/contas-pagar/ocorrencias/${id}`, payload),

  pagarOcorrencia: (id: string, payload: PagarOcorrenciaRequest) =>
    api.post<ContaPagarOcorrencia>(`/api/contas-pagar/ocorrencias/${id}/pagar`, payload),

  cancelarOcorrencia: (id: string, cancelar: boolean = true) =>
    api.post<ContaPagarOcorrencia>(`/api/contas-pagar/ocorrencias/${id}/cancelar`, null, {
      params: { cancelar },
    }),

  obterFinanciamento: (modeloId: string) =>
    api.get<FinanciamentoDetalheResponse>(`/api/contas-pagar/modelos/${modeloId}/financiamento`),

  amortizarFinanciamento: (modeloId: string, payload: AmortizarRequest) =>
    api.post<FinanciamentoDetalheResponse>(
      `/api/contas-pagar/modelos/${modeloId}/amortizar`,
      payload,
    ),

  obterConfigNotificacao: () => api.get<NotificacaoConfig>('/api/contas-pagar/notificacoes/config'),

  salvarConfigNotificacao: (payload: {
    telegramChatId?: string
    telegramAtivo?: boolean
    webPushAtivo?: boolean
  }) => api.put<NotificacaoConfig>('/api/contas-pagar/notificacoes/config', payload),

  testarTelegram: () =>
    api.post<{ enviado: boolean }>('/api/contas-pagar/notificacoes/telegram/testar'),

  registrarPushSubscription: (payload: { endpoint: string; p256dh: string; auth: string }) =>
    api.post<void>('/api/contas-pagar/notificacoes/push/subscribe', payload),
}
