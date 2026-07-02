import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Transacao, Category } from '../../../types'
import { RelatorioCategoria, CategoriaRelatorio, RelatorioFluxoCaixa } from '../../../types/relatorio'

export const relatorioHandler = (url: string, method: string, _data?: any, params?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/relatorios')) {
    return null
  }

  const transacoes = localStorageService.getItem<Transacao[]>(STORAGE_KEYS.TRANSACOES, [])
  const categorias = localStorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])

  // Relatório por Categorias
  if (method === 'get' && cleanUrl.startsWith('/relatorios/categorias')) {
    const dataInicio = params?.dataInicio || '2026-01-01'
    const dataFim = params?.dataFim || '2026-12-31'
    const filtradas = transacoes.filter(t => t.data >= dataInicio && t.data <= dataFim && !t.estornada && (t.tipo === 'SAQUE' || t.tipo === 'COMPRA_CREDITO'))
    const totalConsolidado = filtradas.reduce((acc, t) => acc + (t.valor || 0), 0)

    const catMap = new Map<string, number>()
    filtradas.forEach(t => {
      const cid = t.categoriaId || 'geral'
      catMap.set(cid, (catMap.get(cid) || 0) + (t.valor || 0))
    })

    const lista: CategoriaRelatorio[] = []
    catMap.forEach((val, cid) => {
      const cat = categorias.find(c => c.id === cid)
      lista.push({
        categoriaId: cid,
        categoriaNome: cat ? cat.nome : 'Outros',
        corHexadecimal: cat ? cat.corHexadecimal : '#3B82F6',
        valorTotal: val,
        percentual: totalConsolidado > 0 ? Math.round((val / totalConsolidado) * 1000) / 10 : 0
      })
    })

    const result: RelatorioCategoria = {
      periodo: { dataInicio, dataFim },
      totalConsolidado,
      categorias: lista
    }
    return [200, result]
  }

  // Relatório de Fluxo de Caixa
  if (method === 'get' && cleanUrl.startsWith('/relatorios/fluxo-caixa')) {
    const meses = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07']
    const result: RelatorioFluxoCaixa[] = meses.map(m => {
      // Pega transações que começam com esse ano-mês ou gera dados fictícios coerentes
      const trMes = transacoes.filter(t => t.data.startsWith(m) && !t.estornada)
      let rec = trMes.filter(t => t.tipo === 'DEPOSITO').reduce((acc, t) => acc + (t.valor || 0), 0)
      let desp = trMes.filter(t => t.tipo === 'SAQUE' || t.tipo === 'COMPRA_CREDITO').reduce((acc, t) => acc + (t.valor || 0), 0)
      
      if (rec === 0) rec = 5500.00
      if (desp === 0) desp = 3800.00

      return {
        mesReferencia: m,
        totalReceitas: rec,
        totalDespesas: desp,
        saldoLiquido: rec - desp
      }
    })
    return [200, result]
  }

  // Exportar relatório
  if (method === 'get' && cleanUrl.startsWith('/relatorios/exportar')) {
    return [200, 'Data,Descricao,Valor\n2026-07-01,Exemplo Demo,100.00']
  }

  return null
}
