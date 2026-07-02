import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Orcamento, OrcamentoResumo, Category, Transacao } from '../../../types'

export const orcamentoHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/orcamentos')) {
    return null
  }

  const orcamentos = localStorageService.getItem<Orcamento[]>(STORAGE_KEYS.ORCAMENTOS, [])
  const categorias = localStorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])
  const transacoes = localStorageService.getItem<Transacao[]>(STORAGE_KEYS.TRANSACOES, [])

  // Resumo de Orçamentos
  if (method === 'get' && cleanUrl === '/orcamentos/resumo') {
    const resumo: OrcamentoResumo[] = orcamentos.map(orc => {
      const cat = categorias.find(c => c.id === orc.categoriaId)
      // Soma gastos do mês atual na categoria
      const totalGasto = transacoes
        .filter(t => t.categoriaId === orc.categoriaId && !t.estornada && (t.tipo === 'SAQUE' || t.tipo === 'COMPRA_CREDITO'))
        .reduce((acc, t) => acc + (t.valor || 0), 0)

      return {
        id: orc.id,
        categoriaId: orc.categoriaId,
        categoriaNome: cat ? cat.nome : 'Categoria',
        limiteMensal: orc.limiteMensal || 0,
        totalGasto
      }
    })
    return [200, resumo]
  }

  // Criar ou atualizar orçamento
  if (method === 'post' && cleanUrl === '/orcamentos') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = orcamentos.findIndex(o => o.categoriaId === payload.categoriaId)
    if (idx !== -1) {
      orcamentos[idx].limiteMensal = Number(payload.limiteMensal) || 0
      localStorageService.setItem(STORAGE_KEYS.ORCAMENTOS, orcamentos)
      return [200, orcamentos[idx]]
    } else {
      const novo: Orcamento = {
        id: 'orc-demo-' + Date.now(),
        categoriaId: payload.categoriaId,
        limiteMensal: Number(payload.limiteMensal) || 0
      }
      orcamentos.push(novo)
      localStorageService.setItem(STORAGE_KEYS.ORCAMENTOS, orcamentos)
      return [201, novo]
    }
  }

  // Editar orçamento
  if (method === 'put' && cleanUrl.match(/^\/orcamentos\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const idx = orcamentos.findIndex(o => o.id === id)
    if (idx !== -1) {
      orcamentos[idx].limiteMensal = Number(payload.limiteMensal) || 0
      localStorageService.setItem(STORAGE_KEYS.ORCAMENTOS, orcamentos)
      return [200, orcamentos[idx]]
    }
    return [404, { error: 'Orçamento não encontrado' }]
  }

  // Excluir orçamento
  if (method === 'delete' && cleanUrl.match(/^\/orcamentos\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtrados = orcamentos.filter(o => o.id !== id)
    localStorageService.setItem(STORAGE_KEYS.ORCAMENTOS, filtrados)
    return [200, { success: true }]
  }

  return null
}
