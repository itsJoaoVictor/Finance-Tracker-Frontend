import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Tag } from '../../../types'

export const tagHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/tags')) {
    return null
  }

  const tags = localStorageService.getItem<Tag[]>(STORAGE_KEYS.TAGS, [])

  // Listar tags
  if (method === 'get' && cleanUrl === '/tags') {
    return [200, tags]
  }

  // Criar tag
  if (method === 'post' && cleanUrl === '/tags') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const nova: Tag = {
      id: 'tag-demo-' + Date.now(),
      nome: payload.nome || '#tag',
      corHexadecimal: payload.corHexadecimal || '#3B82F6',
      criadoEm: new Date().toISOString()
    }
    tags.push(nova)
    localStorageService.setItem(STORAGE_KEYS.TAGS, tags)
    return [201, nova]
  }

  return null
}
