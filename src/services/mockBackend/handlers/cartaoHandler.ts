import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Cartao, CartaoResumoResponse, Fatura } from '../../../types'

export const cartaoHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/cartoes')) {
    return null
  }

  const cartoes = localStorageService.getItem<Cartao[]>(STORAGE_KEYS.CARTOES, [])
  const faturas = localStorageService.getItem<Fatura[]>(STORAGE_KEYS.FATURAS, [])

  // Resumo de Cartões
  if (method === 'get' && cleanUrl === '/cartoes/resumo') {
    const totalLimite = cartoes.reduce((acc, c) => acc + (c.limite || 0), 0)
    const totalLimiteDisponivel = cartoes.reduce((acc, c) => acc + (c.limiteDisponivel || 0), 0)
    const totalFaturaEstimada = cartoes.reduce((acc, c) => acc + (c.faturaEstimada || 0), 0)
    const resumo: CartaoResumoResponse = {
      totalLimite,
      totalLimiteDisponivel,
      totalFaturaEstimada,
      quantidadeCartoes: cartoes.length
    }
    return [200, resumo]
  }

  // Listar Faturas do Cartão
  if (method === 'get' && cleanUrl.match(/^\/cartoes\/[^/]+\/faturas$/)) {
    const cartaoId = cleanUrl.split('/')[2]
    // Filtrar faturas que correspondem a este cartão (pelo ID prefixo no nosso mock ou todas as faturas se for mock geral)
    const faturasCartao = faturas.filter(f => f.id.startsWith(`fat-${cartaoId.replace('card-', '')}-`))
    return [200, faturasCartao.length > 0 ? faturasCartao : faturas]
  }

  // Listar Cartões
  if (method === 'get' && cleanUrl === '/cartoes') {
    return [200, cartoes]
  }

  // Obter Cartão por ID
  if (method === 'get' && cleanUrl.match(/^\/cartoes\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const cartao = cartoes.find(c => c.id === id)
    return cartao ? [200, cartao] : [404, { error: 'Cartão não encontrado' }]
  }

  // Criar Cartão
  if (method === 'post' && cleanUrl === '/cartoes') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const novo: Cartao = {
      id: 'card-demo-' + Date.now(),
      nome: payload.nome || 'Novo Cartão',
      limite: Number(payload.limite) || 1000,
      limiteDisponivel: Number(payload.limite) || 1000,
      diaFechamento: Number(payload.diaFechamento) || 10,
      diaVencimento: Number(payload.diaVencimento) || 15,
      contaId: payload.contaId || 'acc-1',
      corHexadecimal: payload.corHexadecimal || '#8B5CF6',
      criadoEm: new Date().toISOString(),
      faturaEstimada: 0,
      faturaStatus: 'ABERTA'
    }
    cartoes.push(novo)
    localStorageService.setItem(STORAGE_KEYS.CARTOES, cartoes)
    return [201, novo]
  }

  // Atualizar Cartão
  if (method === 'put' && cleanUrl.match(/^\/cartoes\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = cartoes.findIndex(c => c.id === id)
    if (idx !== -1) {
      cartoes[idx] = {
        ...cartoes[idx],
        nome: payload.nome !== undefined ? payload.nome : cartoes[idx].nome,
        limite: payload.limite !== undefined ? Number(payload.limite) : cartoes[idx].limite,
        diaFechamento: payload.diaFechamento !== undefined ? Number(payload.diaFechamento) : cartoes[idx].diaFechamento,
        diaVencimento: payload.diaVencimento !== undefined ? Number(payload.diaVencimento) : cartoes[idx].diaVencimento,
        contaId: payload.contaId !== undefined ? payload.contaId : cartoes[idx].contaId,
        corHexadecimal: payload.corHexadecimal !== undefined ? payload.corHexadecimal : cartoes[idx].corHexadecimal
      }
      localStorageService.setItem(STORAGE_KEYS.CARTOES, cartoes)
      return [200, cartoes[idx]]
    }
    return [404, { error: 'Cartão não encontrado' }]
  }

  // Excluir Cartão
  if (method === 'delete' && cleanUrl.match(/^\/cartoes\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtrados = cartoes.filter(c => c.id !== id)
    localStorageService.setItem(STORAGE_KEYS.CARTOES, filtrados)
    return [200, { success: true }]
  }

  return null
}
