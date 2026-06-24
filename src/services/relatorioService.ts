import api from './api'
import { RelatorioCategoria, RelatorioFluxoCaixa } from '../types/relatorio'

export const relatorioService = {
  getCategorias: (params: { dataInicio: string; dataFim: string; tipo?: string }) =>
    api.get<RelatorioCategoria>('/api/relatorios/categorias', { params }),

  getFluxoCaixa: (anos?: number) =>
    api.get<RelatorioFluxoCaixa[]>('/api/relatorios/fluxo-caixa', { params: { anos } }),

  exportar: (formato: string, dataInicio: string, dataFim: string) =>
    api.get('/api/relatorios/exportar', {
      params: { formato, dataInicio, dataFim },
      responseType: 'blob',
    }),
}