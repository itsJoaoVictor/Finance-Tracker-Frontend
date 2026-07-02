import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Assinatura, AssinaturaProxima } from '../../../types'

export const assinaturaHandler = (url: string, method: string, data?: any, params?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/assinaturas')) {
    return null
  }

  const assinaturas = localStorageService.getItem<Assinatura[]>(STORAGE_KEYS.ASSINATURAS, [])

  // Próximas Assinaturas
  if (method === 'get' && cleanUrl.startsWith('/assinaturas/proximas')) {
    const dias = Number(params?.dias) || 7
    const proximas: AssinaturaProxima[] = assinaturas
      .filter(a => a.ativo)
      .map(a => ({
        id: a.id,
        nome: a.nome,
        valor: a.valor,
        cartaoId: a.cartaoId,
        dataProximaCobranca: a.dataProximaCobranca || new Date().toISOString().split('T')[0],
        diasRestantes: Math.floor(Math.random() * dias) + 1
      }))
    return [200, proximas]
  }

  // Listar Assinaturas
  if (method === 'get' && cleanUrl === '/assinaturas') {
    return [200, assinaturas]
  }

  // Obter Assinatura por ID
  if (method === 'get' && cleanUrl.match(/^\/assinaturas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const ass = assinaturas.find(a => a.id === id)
    return ass ? [200, ass] : [404, { error: 'Assinatura não encontrada' }]
  }

  // Criar Assinatura
  if (method === 'post' && cleanUrl === '/assinaturas') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const nova: Assinatura = {
      id: 'ass-demo-' + Date.now(),
      nome: payload.nome || 'Nova Assinatura',
      valor: Number(payload.valor) || 29.90,
      cartaoId: payload.cartaoId || 'card-1',
      categoriaId: payload.categoriaId || 'cat-4',
      tipoRecorrencia: payload.tipoRecorrencia || 'MENSAL',
      frequencia: payload.frequencia,
      unidadeFrequencia: payload.unidadeFrequencia,
      diaCobranca: Number(payload.diaCobranca) || 10,
      dataInicio: payload.dataInicio || new Date().toISOString().split('T')[0],
      dataProximaCobranca: payload.dataInicio || new Date().toISOString().split('T')[0],
      ativo: payload.ativo !== undefined ? payload.ativo : true,
      criadoEm: new Date().toISOString()
    }
    assinaturas.push(nova)
    localStorageService.setItem(STORAGE_KEYS.ASSINATURAS, assinaturas)
    return [201, nova]
  }

  // Atualizar Assinatura
  if (method === 'put' && cleanUrl.match(/^\/assinaturas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = assinaturas.findIndex(a => a.id === id)
    if (idx !== -1) {
      assinaturas[idx] = { ...assinaturas[idx], ...payload }
      localStorageService.setItem(STORAGE_KEYS.ASSINATURAS, assinaturas)
      return [200, assinaturas[idx]]
    }
    return [404, { error: 'Assinatura não encontrada' }]
  }

  // Pausar Assinatura
  if (method === 'post' && cleanUrl.match(/^\/assinaturas\/[^/]+\/pausar$/)) {
    const id = cleanUrl.split('/')[2]
    const idx = assinaturas.findIndex(a => a.id === id)
    if (idx !== -1) {
      assinaturas[idx].ativo = false
      localStorageService.setItem(STORAGE_KEYS.ASSINATURAS, assinaturas)
      return [200, { success: true }]
    }
    return [404, { error: 'Assinatura não encontrada' }]
  }

  // Reativar Assinatura
  if (method === 'post' && cleanUrl.match(/^\/assinaturas\/[^/]+\/reativar$/)) {
    const id = cleanUrl.split('/')[2]
    const idx = assinaturas.findIndex(a => a.id === id)
    if (idx !== -1) {
      assinaturas[idx].ativo = true
      localStorageService.setItem(STORAGE_KEYS.ASSINATURAS, assinaturas)
      return [200, { success: true }]
    }
    return [404, { error: 'Assinatura não encontrada' }]
  }

  // Excluir Assinatura
  if (method === 'delete' && cleanUrl.match(/^\/assinaturas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtradas = assinaturas.filter(a => a.id !== id)
    localStorageService.setItem(STORAGE_KEYS.ASSINATURAS, filtradas)
    return [200, { success: true }]
  }

  return null
}
