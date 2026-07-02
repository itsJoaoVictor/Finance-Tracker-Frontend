import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Agendamento } from '../../../types'

export const agendamentoHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/agendamentos')) {
    return null
  }

  const agendamentos = localStorageService.getItem<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, [])

  // Listar agendamentos
  if (method === 'get' && cleanUrl === '/agendamentos') {
    return [200, agendamentos]
  }

  // Criar agendamento
  if (method === 'post' && cleanUrl === '/agendamentos') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const novo: Agendamento = {
      id: 'agd-demo-' + Date.now(),
      descricao: payload.descricao || 'Novo Agendamento',
      valor: Number(payload.valor) || 0,
      tipo: payload.tipo || 'SAQUE',
      contaOrigemId: payload.contaOrigemId || 'acc-1',
      contaDestinoId: payload.contaDestinoId,
      categoriaId: payload.categoriaId || 'cat-2',
      recorrencia: payload.recorrencia || 'MENSAL',
      diaExecucao: Number(payload.diaExecucao) || 10,
      dataInicio: payload.dataInicio || new Date().toISOString().split('T')[0],
      dataProximaExecucao: payload.dataInicio || new Date().toISOString().split('T')[0],
      ativo: true,
      criadoEm: new Date().toISOString()
    }
    agendamentos.push(novo)
    localStorageService.setItem(STORAGE_KEYS.AGENDAMENTOS, agendamentos)
    return [201, novo]
  }

  // Excluir agendamento
  if (method === 'delete' && cleanUrl.match(/^\/agendamentos\/[^/]+$/)) {
    const id = cleanUrl.split('/')[2]
    const filtrados = agendamentos.filter(a => a.id !== id)
    localStorageService.setItem(STORAGE_KEYS.AGENDAMENTOS, filtrados)
    return [200, { success: true }]
  }

  return null
}
