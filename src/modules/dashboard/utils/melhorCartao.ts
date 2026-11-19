import { Cartao } from '../../../types/cartoes'

export interface ComparacaoCartao {
  id: string
  nome: string
  corHexadecimal?: string
  diaFechamento: number
  diaVencimento: number
  limiteDisponivel: number
  limiteTotal: number
  diasAteFechamento: number
  diasAtePagar: number
  dataFechamento: Date
  dataVencimento: Date
  isMelhor: boolean
  semLimite: boolean
}

export interface ResultadoMelhorCartao {
  melhorCartao: ComparacaoCartao | null
  comparativo: ComparacaoCartao[]
  totalCartoes: number
  todosSemLimite: boolean
}

function criarDataNoMes(ano: number, mes: number, diaDesejado: number): Date {
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const diaReal = Math.min(Math.max(1, diaDesejado), ultimoDia)
  return new Date(ano, mes, diaReal, 0, 0, 0, 0)
}

/**
 * Calcula qual cartão oferece o maior prazo de pagamento hoje.
 * O "melhor dia de compra" é a data de fechamento ou logo após ela,
 * pois qualquer compra efetuada entra na fatura seguinte, garantindo até 30-40 dias para pagar.
 */
export function calcularMelhorCartao(
  cartoes: Cartao[],
  dataReferencia: Date = new Date()
): ResultadoMelhorCartao {
  if (!cartoes || cartoes.length === 0) {
    return {
      melhorCartao: null,
      comparativo: [],
      totalCartoes: 0,
      todosSemLimite: false,
    }
  }

  const hoje = new Date(dataReferencia)
  hoje.setHours(0, 0, 0, 0)
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const diaHoje = hoje.getDate()
  const msPorDia = 1000 * 60 * 60 * 24

  const comparativo: ComparacaoCartao[] = cartoes.map((c) => {
    const diaFech = c.diaFechamento || 1
    const diaVenc = c.diaVencimento || (diaFech > 20 ? 5 : diaFech + 7)

    // Se hoje já passou ou é o dia do fechamento, a fatura deste ciclo fechou,
    // então a próxima fatura fecha no mês seguinte!
    let dataFechamento: Date
    if (diaHoje >= diaFech) {
      dataFechamento = criarDataNoMes(ano, mes + 1, diaFech)
    } else {
      dataFechamento = criarDataNoMes(ano, mes, diaFech)
    }

    // A data de vencimento correspondente à data de fechamento:
    let dataVencimento: Date
    if (diaVenc > diaFech) {
      // Vence no mesmo mês do fechamento
      dataVencimento = criarDataNoMes(dataFechamento.getFullYear(), dataFechamento.getMonth(), diaVenc)
    } else {
      // Vence no mês seguinte ao fechamento (ex: fecha dia 28, vence dia 05 do mês seguinte)
      dataVencimento = criarDataNoMes(dataFechamento.getFullYear(), dataFechamento.getMonth() + 1, diaVenc)
    }

    const diasAteFechamento = Math.max(0, Math.round((dataFechamento.getTime() - hoje.getTime()) / msPorDia))
    const diasAtePagar = Math.max(0, Math.round((dataVencimento.getTime() - hoje.getTime()) / msPorDia))
    const semLimite = (c.limiteDisponivel ?? 0) <= 0

    return {
      id: c.id,
      nome: c.nome,
      corHexadecimal: c.corHexadecimal,
      diaFechamento: diaFech,
      diaVencimento: diaVenc,
      limiteDisponivel: c.limiteDisponivel ?? 0,
      limiteTotal: c.limite ?? 0,
      diasAteFechamento,
      diasAtePagar,
      dataFechamento,
      dataVencimento,
      isMelhor: false,
      semLimite,
    }
  })

  // Cartões com limite disponível têm prioridade absoluta
  const comLimite = comparativo.filter((c) => !c.semLimite)
  const pool = comLimite.length > 0 ? comLimite : comparativo

  // O melhor cartão é aquele que dá mais dias até pagar (maior diasAtePagar).
  // Em caso de empate, escolhe o que tiver mais limite disponível.
  const melhor = pool.reduce<ComparacaoCartao | null>((melhorAtual, item) => {
    if (!melhorAtual) return item
    if (item.diasAtePagar > melhorAtual.diasAtePagar) return item
    if (item.diasAtePagar === melhorAtual.diasAtePagar && item.limiteDisponivel > melhorAtual.limiteDisponivel) {
      return item
    }
    return melhorAtual
  }, null)

  if (melhor) {
    melhor.isMelhor = true
    const index = comparativo.findIndex((c) => c.id === melhor.id)
    if (index !== -1) {
      comparativo[index].isMelhor = true
    }
  }

  // Ordena comparativo: o melhor primeiro, depois por diasAtePagar decrescente
  comparativo.sort((a, b) => {
    if (a.isMelhor) return -1
    if (b.isMelhor) return 1
    return b.diasAtePagar - a.diasAtePagar
  })

  return {
    melhorCartao: melhor,
    comparativo,
    totalCartoes: cartoes.length,
    todosSemLimite: comLimite.length === 0 && cartoes.length > 0,
  }
}
