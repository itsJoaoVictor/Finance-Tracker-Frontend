import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Category } from '../../../types'

export const categoriaHandler = (url: string, method: string, data?: any, params?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/categorias')) {
    return null
  }

  const categorias = localStorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])

  // Listar todas as categorias
  if (method === 'get' && cleanUrl === '/categorias') {
    let result = [...categorias]
    if (params && params.somenteAtivas !== undefined) {
      const somenteAtivas = String(params.somenteAtivas) === 'true' || params.somenteAtivas === true
      if (somenteAtivas) {
        result = result.filter(c => c.ativo)
      }
    }
    return [200, result]
  }

  // Obter categoria por ID
  if (method === 'get' && cleanUrl.match(/^\/categorias\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const cat = categorias.find(c => c.id === id)
    return cat ? [200, cat] : [404, { error: 'Categoria não encontrada' }]
  }

  // Criar categoria
  if (method === 'post' && cleanUrl === '/categorias') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const nova: Category = {
      id: 'cat-demo-' + Date.now(),
      usuarioId: null,
      nome: payload.nome || 'Nova Categoria',
      icone: payload.icone || 'tag',
      corHexadecimal: payload.corHexadecimal || '#3B82F6',
      ativo: true,
      criadoEm: new Date().toISOString()
    }
    categorias.push(nova)
    localStorageService.setItem(STORAGE_KEYS.CATEGORIES, categorias)
    return [201, nova]
  }

  // Atualizar categoria
  if (method === 'put' && cleanUrl.match(/^\/categorias\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = categorias.findIndex(c => c.id === id)
    if (idx !== -1) {
      categorias[idx] = {
        ...categorias[idx],
        nome: payload.nome || categorias[idx].nome,
        icone: payload.icone || categorias[idx].icone,
        corHexadecimal: payload.corHexadecimal || categorias[idx].corHexadecimal
      }
      localStorageService.setItem(STORAGE_KEYS.CATEGORIES, categorias)
      return [200, categorias[idx]]
    }
    return [404, { error: 'Categoria não encontrada' }]
  }

  // Hard Delete
  if (method === 'delete' && cleanUrl.match(/^\/categorias\/[^/]+\/permanentemente$/)) {
    const id = cleanUrl.split('/')[2]
    const filtradas = categorias.filter(c => c.id !== id)
    localStorageService.setItem(STORAGE_KEYS.CATEGORIES, filtradas)
    return [200, { success: true }]
  }

  // Soft Delete (inativar)
  if (method === 'delete' && cleanUrl.match(/^\/categorias\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const idx = categorias.findIndex(c => c.id === id)
    if (idx !== -1) {
      categorias[idx].ativo = false
      localStorageService.setItem(STORAGE_KEYS.CATEGORIES, categorias)
      return [200, categorias[idx]]
    }
    return [404, { error: 'Categoria não encontrada' }]
  }

  // Ativar categoria
  if (method === 'patch' && cleanUrl.match(/^\/categorias\/[^/]+\/ativar$/)) {
    const id = cleanUrl.split('/')[2]
    const idx = categorias.findIndex(c => c.id === id)
    if (idx !== -1) {
      categorias[idx].ativo = true
      localStorageService.setItem(STORAGE_KEYS.CATEGORIES, categorias)
      return [200, categorias[idx]]
    }
    return [404, { error: 'Categoria não encontrada' }]
  }

  return null
}
