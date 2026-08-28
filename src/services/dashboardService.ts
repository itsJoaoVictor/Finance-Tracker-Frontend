import api from './api'
import { DashboardResumo, LayoutRequest } from '../types/dashboard'

export const dashboardService = {
  getPreferencias: () => api.get<DashboardResumo['preferenciasLayout']>('/api/dashboard/preferencias'),
  getKpis: (periodo: string = 'MES_ATUAL') => api.get<DashboardResumo['kpis']>('/api/dashboard/kpis', { params: { periodo } }),
  getContas: (periodo: string = 'MES_ATUAL') => api.get<DashboardResumo['contas']>('/api/dashboard/contas', { params: { periodo } }),
  getCartoes: (periodo: string = 'MES_ATUAL') => api.get<DashboardResumo['cartoes']>('/api/dashboard/cartoes', { params: { periodo } }),
  getProjecao: () => api.get<DashboardResumo['projetcao15Dias']>('/api/dashboard/projecao'),
  getTransacoes: (periodo: string = 'MES_ATUAL') => api.get<DashboardResumo['ultimasTransacoes']>('/api/dashboard/transacoes', { params: { periodo } }),
  getInsights: () => api.get<DashboardResumo['insightsAtivos']>('/api/dashboard/insights'),

  salvarLayout: (payload: LayoutRequest) =>
    api.put<void>('/api/dashboard/layout', payload),
}