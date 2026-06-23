import api from './api'
import { Tag, TagCriacaoRequest } from '../types'

export const tagService = {
  getAll: () => api.get<Tag[]>('/api/tags'),
  create: (payload: TagCriacaoRequest) => api.post<Tag>('/api/tags', payload),
}
