import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { MetaEconomia, Conta } from '../../../types'

export const metaHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/metas')) {
    return null
  }

  const metas = localStorageService.getItem<MetaEconomia[]>(STORAGE_KEYS.METAS, [])
  const contas = localStorageService.getItem<Conta[]>(STORAGE_KEYS.CONTAS, [])

  // Listar Metas
  if (method === 'get' && cleanUrl === '/metas') {
    return [200, metas]
  }

  // Depósito na Meta
  if (method === 'post' && cleanUrl.match(/^\/metas\/[^/]+\/deposito$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const val = Number(payload.valor) || 0
    const meta = metas.find(m => m.id === id)
    const conta = contas.find(c => c.id === payload.contaOrigemId)

    if (meta && conta) {
      meta.valorAcumulado += val
      conta.saldo -= val
      localStorageService.setItem(STORAGE_KEYS.METAS, metas)
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
      return [200, meta]
    }
    return [400, { error: 'Meta ou conta não encontrada' }]
  }

  // Resgate da Meta
  if (method === 'post' && cleanUrl.match(/^\/metas\/[^/]+\/resgate$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const val = Number(payload.valor) || 0
    const meta = metas.find(m => m.id === id)
    const conta = contas.find(c => c.id === payload.contaDestinoId)

    if (meta && conta) {
      meta.valorAcumulado = Math.max(0, meta.valorAcumulado - val)
      conta.saldo += val
      localStorageService.setItem(STORAGE_KEYS.METAS, metas)
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
      return [200, meta]
    }
    return [400, { error: 'Meta ou conta não encontrada' }]
  }

  // Criar Meta
  if (method === 'post' && cleanUrl === '/metas') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const nova: MetaEconomia = {
      id: 'meta-demo-' + Date.now(),
      nome: payload.nome || 'Nova Meta',
      valorAlvo: Number(payload.valorAlvo) || 1000,
      valorAcumulado: 0,
      contaVinculadaId: payload.contaVinculadaId || 'acc-1',
      criadoEm: new Date().toISOString()
    }
    metas.push(nova)
    localStorageService.setItem(STORAGE_KEYS.METAS, metas)
    return [201, nova]
  }

  // Excluir Meta
  if (method === 'delete' && cleanUrl.match(/^\/metas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtradas = metas.filter(m => m.id !== id)
    localStorageService.setItem(STORAGE_KEYS.METAS, filtradas)
    return [200, { success: true }]
  }

  return null
}
