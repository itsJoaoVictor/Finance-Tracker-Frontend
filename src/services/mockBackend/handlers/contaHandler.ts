import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Conta, ContaResumoResponse } from '../../../types'

export const contaHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/contas')) {
    return null
  }

  const contas = localStorageService.getItem<Conta[]>(STORAGE_KEYS.CONTAS, [])

  // Resumo de Contas
  if (method === 'get' && cleanUrl === '/contas/resumo') {
    const totalSaldo = contas.reduce((acc, c) => acc + (c.saldo || 0), 0)
    const resumo: ContaResumoResponse = {
      totalSaldo,
      quantidadeContas: contas.length
    }
    return [200, resumo]
  }

  // Listar Contas
  if (method === 'get' && cleanUrl === '/contas') {
    return [200, contas]
  }

  // Obter Conta por ID
  if (method === 'get' && cleanUrl.match(/^\/contas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const conta = contas.find(c => c.id === id)
    return conta ? [200, conta] : [404, { error: 'Conta não encontrada' }]
  }

  // Criar Conta
  if (method === 'post' && cleanUrl === '/contas') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    if (payload.contaPadrao) {
      contas.forEach(c => c.contaPadrao = false)
    }
    const nova: Conta = {
      id: 'acc-demo-' + Date.now(),
      nome: payload.nome || 'Nova Conta',
      tipo: payload.tipo || 'CORRENTE',
      saldo: Number(payload.saldo) || 0,
      corHexadecimal: payload.corHexadecimal || '#8B5CF6',
      contaPadrao: Boolean(payload.contaPadrao),
      criadoEm: new Date().toISOString()
    }
    contas.push(nova)
    localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
    return [201, nova]
  }

  // Atualizar Conta
  if (method === 'put' && cleanUrl.match(/^\/contas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = contas.findIndex(c => c.id === id)
    if (idx !== -1) {
      if (payload.contaPadrao) {
        contas.forEach(c => c.contaPadrao = false)
      }
      contas[idx] = {
        ...contas[idx],
        nome: payload.nome !== undefined ? payload.nome : contas[idx].nome,
        tipo: payload.tipo !== undefined ? payload.tipo : contas[idx].tipo,
        corHexadecimal: payload.corHexadecimal !== undefined ? payload.corHexadecimal : contas[idx].corHexadecimal,
        contaPadrao: payload.contaPadrao !== undefined ? payload.contaPadrao : contas[idx].contaPadrao
      }
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
      return [200, contas[idx]]
    }
    return [404, { error: 'Conta não encontrada' }]
  }

  // Excluir Conta
  if (method === 'delete' && cleanUrl.match(/^\/contas\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtradas = contas.filter(c => c.id !== id)
    localStorageService.setItem(STORAGE_KEYS.CONTAS, filtradas)
    return [200, { success: true }]
  }

  return null
}
