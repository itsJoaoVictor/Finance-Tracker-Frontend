import api from './api'
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '../types'

export const categoryService = {
  getAll: (somenteAtivas?: boolean) => {
    const params = somenteAtivas !== undefined ? { somenteAtivas } : {}
    return api.get<Category[]>('/api/categorias', { params })
  },
  getById: (id: string) => api.get<Category>(`/api/categorias/${id}`),
  create: (payload: CategoryCreateRequest) => api.post<Category>('/api/categorias', payload),
  update: (id: string, payload: CategoryUpdateRequest) => api.put<Category>(`/api/categorias/${id}`, payload),
  softDelete: (id: string) => api.delete(`/api/categorias/${id}`),
  hardDelete: (id: string) => api.delete(`/api/categorias/${id}/permanentemente`),
  ativar: (id: string) => api.patch(`/api/categorias/${id}/ativar`),
}
