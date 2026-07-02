import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Transacao, Conta, Cartao, SugestaoResponse, Projecao, Category } from '../../../types'

export const transacaoHandler = (url: string, method: string, data?: any, params?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/transacoes')) {
    return null
  }

  const transacoes = localStorageService.getItem<Transacao[]>(STORAGE_KEYS.TRANSACOES, [])
  const contas = localStorageService.getItem<Conta[]>(STORAGE_KEYS.CONTAS, [])
  const cartoes = localStorageService.getItem<Cartao[]>(STORAGE_KEYS.CARTOES, [])
  const categorias = localStorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])

  // Sugestão de IA para categoria/tag
  if (method === 'get' && cleanUrl.startsWith('/transacoes/sugestao')) {
    const desc = (params?.descricao || '').toLowerCase()
    let sugCat = categorias[0]
    if (desc.includes('uber') || desc.includes('posto') || desc.includes('gasolina') || desc.includes('onibus') || desc.includes('metrô')) {
      sugCat = categorias.find(c => c.nome === 'Transporte') || sugCat
    } else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cinema') || desc.includes('show') || desc.includes('jogo')) {
      sugCat = categorias.find(c => c.nome === 'Lazer') || sugCat
    } else if (desc.includes('salario') || desc.includes('pagamento') || desc.includes('freela')) {
      sugCat = categorias.find(c => c.nome === 'Salário') || sugCat
    } else if (desc.includes('farmacia') || desc.includes('medico') || desc.includes('academia') || desc.includes('saude')) {
      sugCat = categorias.find(c => c.nome === 'Saúde') || sugCat
    } else if (desc.includes('curso') || desc.includes('livro') || desc.includes('faculdade') || desc.includes('escola')) {
      sugCat = categorias.find(c => c.nome === 'Educação') || sugCat
    } else {
      sugCat = categorias.find(c => c.nome === 'Alimentação') || sugCat
    }
    const sugestao: SugestaoResponse = {
      categoriaId: sugCat ? sugCat.id : 'cat-1',
      categoriaNome: sugCat ? sugCat.nome : 'Alimentação',
      tagIds: []
    }
    return [200, sugestao]
  }

  // Projeção de Saldo
  if (method === 'get' && cleanUrl.startsWith('/transacoes/projecao')) {
    const dias = Number(params?.dias) || 30
    const projecoes: Projecao[] = []
    let saldo = contas.reduce((acc, c) => acc + (c.saldo || 0), 0)
    const hoje = new Date()
    for (let i = 0; i < dias; i++) {
      const d = new Date(hoje)
      d.setDate(d.getDate() + i)
      // Adiciona uma variação fictícia suave para o gráfico de projeção ficar bonito
      if (i % 5 === 0 && i > 0) saldo -= 150
      if (i === 15) saldo += 3500 // Simula recebimento
      projecoes.push({
        data: d.toISOString().split('T')[0],
        saldoProjetado: Math.round(saldo * 100) / 100
      })
    }
    return [200, projecoes]
  }

  // Transações por Fatura
  if (method === 'get' && cleanUrl.match(/^\/transacoes\/fatura\/[^/]+$/)) {
    const faturaId = cleanUrl.split('/')[3]
    const list = transacoes.filter(t => t.faturaId === faturaId || t.tipo === 'COMPRA_CREDITO')
    return [200, list]
  }

  // Listar Transações (com paginação e filtros)
  if (method === 'get' && (cleanUrl === '/transacoes' || cleanUrl.startsWith('/transacoes?'))) {
    let list = [...transacoes]
    if (params) {
      if (params.tipo) {
        list = list.filter(t => t.tipo === params.tipo)
      }
      if (params.descricao) {
        const d = params.descricao.toLowerCase()
        list = list.filter(t => t.descricao.toLowerCase().includes(d))
      }
      if (params.dataInicio) {
        list = list.filter(t => t.data >= params.dataInicio)
      }
      if (params.dataFim) {
        list = list.filter(t => t.data <= params.dataFim)
      }
    }
    // Ordenar decrescente por data
    list.sort((a, b) => b.data.localeCompare(a.data))

    const page = Number(params?.page) || 0
    const size = Number(params?.size) || 50
    const totalElements = list.length
    const totalPages = Math.ceil(totalElements / size) || 1
    const content = list.slice(page * size, (page + 1) * size)

    return [
      200,
      {
        content,
        totalPages,
        totalElements,
        number: page,
        size
      }
    ]
  }

  // Transferir
  if (method === 'post' && cleanUrl === '/transacoes/transferir') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const val = Number(payload.valor) || 0
    const cOrigem = contas.find(c => c.id === payload.contaOrigemId)
    const cDestino = contas.find(c => c.id === payload.contaDestinoId)

    if (cOrigem && cDestino) {
      cOrigem.saldo -= val
      cDestino.saldo += val
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
    }

    const nova: Transacao = {
      id: 'tr-demo-' + Date.now(),
      descricao: payload.descricao || `Transferência de ${cOrigem?.nome || ''} para ${cDestino?.nome || ''}`,
      valor: val,
      tipo: 'TRANSFERENCIA',
      contaOrigemId: payload.contaOrigemId,
      contaOrigemNome: cOrigem?.nome,
      contaDestinoId: payload.contaDestinoId,
      contaDestinoNome: cDestino?.nome,
      categoriaId: payload.categoriaId || 'cat-6',
      categoriaNome: 'Investimentos',
      data: new Date().toISOString().split('T')[0],
      estornada: false
    }
    transacoes.unshift(nova)
    localStorageService.setItem(STORAGE_KEYS.TRANSACOES, transacoes)
    return [201, nova]
  }

  // Pagar Fatura
  if (method === 'post' && cleanUrl === '/transacoes/pagar-fatura') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const val = Number(payload.valor) || 0
    const cOrigem = contas.find(c => c.id === payload.contaOrigemId)
    if (cOrigem) {
      cOrigem.saldo -= val
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
    }

    const cartao = cartoes[0]
    if (cartao) {
      cartao.limiteDisponivel = Math.min(cartao.limite, cartao.limiteDisponivel + val)
      cartao.faturaEstimada = Math.max(0, (cartao.faturaEstimada || 0) - val)
      localStorageService.setItem(STORAGE_KEYS.CARTOES, cartoes)
    }

    const nova: Transacao = {
      id: 'tr-demo-' + Date.now(),
      descricao: 'Pagamento de Fatura de Cartão',
      valor: val,
      tipo: 'PAGAMENTO_CREDITO',
      contaOrigemId: payload.contaOrigemId,
      contaOrigemNome: cOrigem?.nome,
      faturaId: payload.faturaId,
      data: new Date().toISOString().split('T')[0],
      estornada: false
    }
    transacoes.unshift(nova)
    localStorageService.setItem(STORAGE_KEYS.TRANSACOES, transacoes)
    return [201, nova]
  }

  // Estornar
  if (method === 'post' && cleanUrl.match(/^\/transacoes\/[^/]+\/estornar$/)) {
    const id = cleanUrl.split('/')[2]
    const tr = transacoes.find(t => t.id === id)
    if (tr) {
      tr.estornada = true
      localStorageService.setItem(STORAGE_KEYS.TRANSACOES, transacoes)
      return [200, tr]
    }
    return [404, { error: 'Transação não encontrada' }]
  }

  // Antecipar Parcelas
  if (method === 'post' && cleanUrl.match(/^\/transacoes\/[^/]+\/antecipar-parcelas$/)) {
    const id = cleanUrl.split('/')[2]
    const tr = transacoes.find(t => t.id === id)
    return tr ? [200, tr] : [404, { error: 'Transação não encontrada' }]
  }

  // Criar Transação
  if (method === 'post' && cleanUrl === '/transacoes') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const val = Number(payload.valor) || 0
    const cat = categorias.find(c => c.id === payload.categoriaId)
    const cOrigem = contas.find(c => c.id === payload.contaOrigemId)
    const cDestino = contas.find(c => c.id === payload.contaDestinoId)
    const cartao = cartoes.find(c => c.id === payload.cartaoId)

    // Atualizar saldos locais
    if (payload.tipo === 'DEPOSITO' && cDestino) {
      cDestino.saldo += val
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
    } else if (payload.tipo === 'SAQUE' && cOrigem) {
      cOrigem.saldo -= val
      localStorageService.setItem(STORAGE_KEYS.CONTAS, contas)
    } else if (payload.tipo === 'COMPRA_CREDITO' && cartao) {
      cartao.limiteDisponivel = Math.max(0, cartao.limiteDisponivel - val)
      cartao.faturaEstimada = (cartao.faturaEstimada || 0) + val
      localStorageService.setItem(STORAGE_KEYS.CARTOES, cartoes)
    }

    const nova: Transacao = {
      id: 'tr-demo-' + Date.now(),
      descricao: payload.descricao || 'Nova Transação',
      valor: val,
      tipo: payload.tipo || 'SAQUE',
      contaOrigemId: payload.contaOrigemId,
      contaOrigemNome: cOrigem?.nome,
      contaDestinoId: payload.contaDestinoId,
      contaDestinoNome: cDestino?.nome,
      cartaoId: payload.cartaoId,
      categoriaId: payload.categoriaId,
      categoriaNome: cat?.nome || 'Geral',
      data: payload.data || new Date().toISOString().split('T')[0],
      numeroParcela: payload.totalParcelas > 1 ? 1 : undefined,
      totalParcelas: payload.totalParcelas > 1 ? payload.totalParcelas : undefined,
      estornada: false,
      tagIds: payload.tagIds || [],
      criadoEm: new Date().toISOString()
    }
    transacoes.unshift(nova)
    localStorageService.setItem(STORAGE_KEYS.TRANSACOES, transacoes)
    return [201, nova]
  }

  // Excluir Transação
  if (method === 'delete' && cleanUrl.match(/^\/transacoes\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtradas = transacoes.filter(t => t.id !== id)
    localStorageService.setItem(STORAGE_KEYS.TRANSACOES, filtradas)
    return [200, { success: true }]
  }

  return null
}
