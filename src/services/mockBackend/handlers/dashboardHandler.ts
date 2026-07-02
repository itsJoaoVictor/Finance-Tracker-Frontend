import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Conta, Cartao, Transacao, Category } from '../../../types'
import { DashboardResumo, ContaDashboard, CartaoDashboard, TransacaoDashboard, InsightDashboard } from '../../../types/dashboard'
import { IaInsight } from '../../iaService'

export const dashboardHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/dashboard')) {
    return null
  }

  // Obter e salvar preferências de layout
  if (method === 'put' && cleanUrl === '/dashboard/layout') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    localStorageService.setItem(STORAGE_KEYS.DASHBOARD_LAYOUT, payload)
    return [200, { success: true }]
  }

  // Resumo Geral do Dashboard
  if (method === 'get' && cleanUrl.startsWith('/dashboard/resumo')) {
    const contas = localStorageService.getItem<Conta[]>(STORAGE_KEYS.CONTAS, [])
    const cartoes = localStorageService.getItem<Cartao[]>(STORAGE_KEYS.CARTOES, [])
    const transacoes = localStorageService.getItem<Transacao[]>(STORAGE_KEYS.TRANSACOES, [])
    const categorias = localStorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])
    const layout = localStorageService.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT, { ordemWidgets: [], widgetsOcultos: [] })
    const insights = localStorageService.getItem<IaInsight[]>(STORAGE_KEYS.INSIGHTS_IA, [])

    const saldoTotal = contas.reduce((acc, c) => acc + (c.saldo || 0), 0)
    const faturaTotalCartoes = cartoes.reduce((acc, c) => acc + (c.faturaEstimada || 0), 0)
    const limiteTotalDisponivelCartoes = cartoes.reduce((acc, c) => acc + (c.limiteDisponivel || 0), 0)

    const contasDash: ContaDashboard[] = contas.map(c => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      saldo: c.saldo || 0,
      corHexadecimal: c.corHexadecimal || '#8B5CF6'
    }))

    const cartoesDash: CartaoDashboard[] = cartoes.map(c => ({
      id: c.id,
      nome: c.nome,
      faturaAtual: c.faturaEstimada || 0,
      limiteDisponivel: c.limiteDisponivel || 0,
      corHexadecimal: c.corHexadecimal || '#1E293B'
    }))

    // Pegar as 6 últimas transações
    const sortedTr = [...transacoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6)
    const ultimasTransacoes: TransacaoDashboard[] = sortedTr.map(t => {
      const cat = categorias.find(c => c.id === t.categoriaId)
      return {
        id: t.id,
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo,
        categoriaNome: cat ? cat.nome : (t.categoriaNome || 'Geral'),
        categoriaIcone: cat ? cat.icone : 'tag',
        categoriaCorHexadecimal: cat ? cat.corHexadecimal : '#3B82F6',
        data: t.data
      }
    })

    const insightsAtivos: InsightDashboard[] = insights.filter(i => !i.lido).map(i => ({
      id: i.id,
      tipo: i.tipo,
      titulo: i.titulo,
      mensagem: i.mensagem,
      criadoEm: i.criadoEm
    }))

    const resumo: DashboardResumo = {
      preferenciasLayout: layout,
      kpis: {
        saldoTotal,
        faturaTotalCartoes,
        limiteTotalDisponivelCartoes
      },
      projetcao15Dias: {
        saldoProjetado: saldoTotal + 1850.00,
        status: 'VERDE',
        mensagem: 'Sua projeção financeira para os próximos 15 dias é positiva! O saldo previsto cobre confortavelmente as despesas agendadas.'
      },
      contas: contasDash,
      cartoes: cartoesDash,
      ultimasTransacoes,
      insightsAtivos
    }

    return [200, resumo]
  }

  return null
}
