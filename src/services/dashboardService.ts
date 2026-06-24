import api from './api'
import { DashboardResumo, LayoutRequest } from '../types/dashboard'

export const dashboardService = {
  getResumo: (periodo: string = 'MES_ATUAL') =>
    api.get<DashboardResumo>('/api/dashboard/resumo', { params: { periodo } }),

  salvarLayout: (payload: LayoutRequest) =>
    api.put<void>('/api/dashboard/layout', payload),
}