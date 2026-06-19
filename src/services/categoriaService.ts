import api from './api'
import { Categoria, CategoriaRequest } from '../types'

export const categoriaService = {
  getAll: (somenteAtivas = true) => 
    api.get<Categoria[]>('/api/categorias', { params: { somenteAtivas } }),
  getById: (id: string) => 
    api.get<Categoria>(`/api/categorias/${id}`),
  create: (payload: CategoriaRequest) => 
    api.post<Categoria>('/api/categorias', payload),
  update: (id: string, payload: CategoriaRequest) => 
    api.put<Categoria>(`/api/categorias/${id}`, payload),
  softDelete: (id: string) => 
    api.delete(`/api/categorias/${id}`),
  ativar: (id: string) => 
    api.patch(`/api/categorias/${id}/ativar`),
}
