import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { DesejoCompra } from '../../desejoCompraService'

export const desejoHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/desejos-compra')) {
    return null
  }

  const desejos = localStorageService.getItem<DesejoCompra[]>(STORAGE_KEYS.DESEJOS, [])

  // Listar desejos
  if (method === 'get' && cleanUrl === '/desejos-compra') {
    return [200, desejos]
  }

  // Criar desejo
  if (method === 'post' && cleanUrl === '/desejos-compra') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const novo: DesejoCompra = {
      id: 'des-demo-' + Date.now(),
      nome: payload.nome || 'Novo Item',
      valor: Number(payload.valor) || 0
    }
    desejos.push(novo)
    localStorageService.setItem(STORAGE_KEYS.DESEJOS, desejos)
    return [201, novo]
  }

  // Atualizar desejo
  if (method === 'put' && cleanUrl.match(/^\/desejos-compra\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = desejos.findIndex(d => d.id === id)
    if (idx !== -1) {
      desejos[idx] = {
        ...desejos[idx],
        nome: payload.nome || desejos[idx].nome,
        valor: payload.valor !== undefined ? Number(payload.valor) : desejos[idx].valor
      }
      localStorageService.setItem(STORAGE_KEYS.DESEJOS, desejos)
      return [200, desejos[idx]]
    }
    return [404, { error: 'Item não encontrado' }]
  }

  // Excluir desejo
  if (method === 'delete' && cleanUrl.match(/^\/desejos-compra\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtrados = desejos.filter(d => d.id !== id)
    localStorageService.setItem(STORAGE_KEYS.DESEJOS, filtrados)
    return [200, { success: true }]
  }

  return null
}
