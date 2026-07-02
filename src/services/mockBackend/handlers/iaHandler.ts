import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { Cartao, Category } from '../../../types'
import {
  IaCategorizarResponse,
  IaInsight,
  IaSimulacaoParcela,
  SimulacaoCompraResponse,
  FadigaAssinaturaResponse,
  InteligenciaAssinaturaResponse,
  DominioEfeitoDominoResponse,
  FolgaLimiteResponse,
  PendenteConfirmacao
} from '../../iaService'
import { ProjecaoCartoesResponse } from '../../../types/cartoes'

export const iaHandler = (url: string, method: string, data?: any, _params?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  if (!cleanUrl.startsWith('/ia')) {
    return null
  }

  const categorias = localStorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, [])
  const insights = localStorageService.getItem<IaInsight[]>(STORAGE_KEYS.INSIGHTS_IA, [])
  const cartoes = localStorageService.getItem<Cartao[]>(STORAGE_KEYS.CARTOES, [])

  // Categorização automática via IA
  if (method === 'post' && cleanUrl === '/ia/categorizar') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const desc = (payload.descricaoFatura || '').toLowerCase()
    let cat = categorias[0]
    if (desc.includes('uber') || desc.includes('posto') || desc.includes('auto')) {
      cat = categorias.find(c => c.nome === 'Transporte') || cat
    } else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cinema')) {
      cat = categorias.find(c => c.nome === 'Lazer') || cat
    } else if (desc.includes('farmacia') || desc.includes('drogasil') || desc.includes('raia')) {
      cat = categorias.find(c => c.nome === 'Saúde') || cat
    } else {
      cat = categorias.find(c => c.nome === 'Alimentação') || cat
    }

    const resp: IaCategorizarResponse = {
      categoriaSugerida: cat ? cat.nome : 'Alimentação',
      categoriaId: cat ? cat.id : undefined,
      confianca: 0.94,
      justificativa: `Modo Demo: O termo "${payload.descricaoFatura || 'item'}" foi associado ao padrão de gastos em ${cat ? cat.nome : 'Alimentação'}.`
    }
    return [200, resp]
  }

  // Registro de Correção de IA
  if (method === 'post' && cleanUrl === '/ia/correcao') {
    return [200, { success: true, message: 'Correção registrada com sucesso no modelo de demonstração!' }]
  }

  // Listar Insights
  if (method === 'get' && cleanUrl === '/ia/insights') {
    return [200, insights]
  }

  // Marcar como lido
  if (method === 'put' && cleanUrl.match(/^\/ia\/insights\/[^/]+\/ler$/)) {
    const id = cleanUrl.split('/')[3]
    const idx = insights.findIndex(i => i.id === id)
    if (idx !== -1) {
      insights[idx].lido = true
      localStorageService.setItem(STORAGE_KEYS.INSIGHTS_IA, insights)
    }
    return [200, { success: true }]
  }

  // Enviar feedback
  if (method === 'post' && cleanUrl.match(/^\/ia\/insights\/[^/]+\/feedback$/)) {
    return [200, { success: true }]
  }

  // Processar Insights
  if (method === 'post' && cleanUrl.startsWith('/ia/insights/processar')) {
    return [200, { message: 'Análise de Inteligência Artificial concluída no Modo Demo!' }]
  }

  // Simular Parcela
  if (method === 'post' && cleanUrl === '/ia/simular-parcela') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const cartaoId = payload.cartaoId
    const valorTotal = Number(payload.valorTotal) || 1200
    const parcelas = Number(payload.parcelas) || 6
    const cartao = cartoes.find(c => c.id === cartaoId) || cartoes[0] || { limite: 8000, limiteDisponivel: 6000 }

    const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100
    const percentual = Math.round((valorTotal / (cartao.limite || 1)) * 100)
    const impactoNegativo = percentual > 40

    const projecoesMensais = []
    const hoje = new Date()
    for (let i = 1; i <= parcelas; i++) {
      const m = new Date(hoje)
      m.setMonth(m.getMonth() + i)
      const mesStr = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
      projecoesMensais.push({
        mes: mesStr,
        valorJaNaFatura: 450.00,
        valorParcela: valorParcela,
        valorComParcela: 450.00 + valorParcela
      })
    }

    const res: IaSimulacaoParcela = {
      impactoNegativo,
      mensagem: impactoNegativo
        ? `Atenção: Esta compra consome ${percentual}% do seu limite total no cartão. Sugerimos parcelar em um número maior de vezes se quiser preservar o fluxo de caixa mensal.`
        : `Simulação favorável! A parcela de R$ ${valorParcela.toFixed(2)} cabe confortavelmente no seu orçamento e consome apenas ${percentual}% do limite.`,
      valorParcela,
      percentualDoLimite: percentual,
      limiteDisponivel: (cartao.limiteDisponivel || 0) - valorTotal,
      projecoesMensais
    }
    return [200, res]
  }

  // Projeção Cartões
  if (method === 'post' && cleanUrl === '/ia/projecao-cartoes') {
    const res: ProjecaoCartoesResponse = {
      projecoes: cartoes.map(c => ({
        cartaoId: c.id,
        cartaoNome: c.nome,
        corHexadecimal: c.corHexadecimal || '#8B5CF6',
        statusFatura: 'ABERTA',
        valorAtualNoMes: c.faturaEstimada || 1500,
        projecaoFechamento: (c.faturaEstimada || 1500) + 350,
        projecaoViaIa: true,
        classificacao: 'DENTRO',
        mensagemResumo: `Projeção da IA estima fechamento em R$ ${((c.faturaEstimada || 1500) + 350).toFixed(2)}, dentro da média dos últimos meses.`,
        diasNoMes: 30,
        diasPassados: 15
      })),
      totalCartoes: cartoes.length,
      dadosInsuficientes: false
    }
    return [200, res]
  }

  // Planejador Inteligente de Compras
  if (method === 'post' && cleanUrl === '/ia/planejador-compras') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const valorTotal = Number(payload.valorTotal) || 4500
    const parcelas = Number(payload.parcelas) || 10
    const nomeItem = payload.nomeItem || 'Item Desejado'
    const novaParcela = Math.round((valorTotal / parcelas) * 100) / 100

    const hoje = new Date()
    const simulacoesMesAMes = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje)
      d.setMonth(d.getMonth() + i)
      const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      simulacoesMesAMes.push({
        mesAno,
        receitaProjetada: 5500,
        despesaFixaProjetada: 2300,
        faturasProjetadas: 1200,
        faturasProjetadasCartao: 1200,
        novaParcela: i < parcelas ? novaParcela : 0,
        saldoLivre: 5500 - 2300 - 1200 - (i < parcelas ? novaParcela : 0),
        status: (5500 - 2300 - 1200 - (i < parcelas ? novaParcela : 0)) > 500 ? 'VERDE' : 'AMARELO',
        limiteRestanteCartao: 5500
      } as any)
    }

    const res: SimulacaoCompraResponse = {
      viavel: true,
      mesRecomendadoParaCompra: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`,
      parcelasRecomendadas: parcelas,
      mensagemRecomendacao: `A compra do item "${nomeItem}" por R$ ${valorTotal.toFixed(2)} em ${parcelas}x de R$ ${novaParcela.toFixed(2)} é VIÁVEL. Seu saldo livre projetado nos próximos meses se mantém acima da zona de risco.`,
      simulacoesMesAMes,
      analiseCartao: {
        cartaoId: 'card-1',
        cartaoNome: 'Nubank Mastercard',
        limiteAprovado: true,
        limiteDisponivelAtual: 6450.00,
        limiteAposCompra: 6450.00 - valorTotal,
        melhorDiaCompra: 'Dia 6 (após fechamento)',
        diasGanhoFolego: 38,
        recomendacaoIa: 'Recomendamos utilizar o Nubank Mastercard logo após o dia 5 para ganhar até 38 dias para o primeiro pagamento.'
      }
    }
    return [200, res]
  }

  // Fadiga de Assinatura
  if (method === 'post' && cleanUrl === '/ia/fadiga-assinatura') {
    const res: FadigaAssinaturaResponse = {
      totalAssinaturas: 4,
      totalEssenciais: 1,
      totalImportantes: 2,
      totalDiscricionarias: 1,
      totalGeral: 212.60,
      indiceAssinaturas: 3.8,
      indiceNaoEssencial: 45,
      classificacaoGlobal: 'SAUDÁVEL',
      nivelAlerta: 'BAIXO',
      itens: [
        { nome: 'Netflix 4K', categoria: 'Lazer', valorMensal: 55.90, essencialidade: 'IMPORTANTE', nivelEmoji: '📺' },
        { nome: 'Spotify Premium', categoria: 'Lazer', valorMensal: 21.90, essencialidade: 'IMPORTANTE', nivelEmoji: '🎵' },
        { nome: 'Gympass Academia', categoria: 'Saúde', valorMensal: 119.90, essencialidade: 'ESSENCIAL', nivelEmoji: '🏋️' },
        { nome: 'Amazon Prime', categoria: 'Lazer', valorMensal: 14.90, essencialidade: 'DISCRICIONARIA', nivelEmoji: '📦' }
      ],
      duplicadasPorCategoria: { 'Lazer': 3 },
      servicosSemelhantes: ['Netflix 4K e Amazon Prime podem possuir sobreposição de catálogo em vídeo.'],
      mensagem: 'Seu ecossistema de assinaturas está equilibrado, mas identificamos 3 serviços de streaming na mesma categoria.'
    }
    return [200, res]
  }

  // Inteligência de Assinatura
  if (method === 'post' && cleanUrl === '/ia/assinaturas/inteligencia') {
    const res: InteligenciaAssinaturaResponse = {
      reajustes: [
        {
          assinaturaId: 'ass-1',
          nome: 'Netflix 4K',
          categoria: 'Lazer',
          valorAnterior: 49.90,
          valorAtual: 55.90,
          percentualAumento: 12.02,
          impactoAnual: 72.00,
          alteracaoVoluntaria: false
        }
      ]
    }
    return [200, res]
  }

  // Pendentes Confirmação
  if (method === 'get' && cleanUrl === '/ia/assinaturas/pendentes-confirmacao') {
    const res: PendenteConfirmacao[] = []
    return [200, res]
  }

  // Efeito Dominó
  if (method === 'post' && cleanUrl === '/ia/efeito-dominio') {
    const res: DominioEfeitoDominoResponse = {
      alertas: [
        {
          cartaoId: 'card-1',
          cartaoNome: 'Nubank Mastercard',
          limiteDisponivel: 6450.00,
          totalCobranca: 197.70,
          diasRestantes: 5,
          essenciaisAfetadas: 0,
          importantesAfetadas: 0,
          opcionaisAfetadas: 0,
          nivelAlerta: 'SEGURO',
          ranking: [],
          recomendacoes: ['Seu limite atual é excelente e garante o processamento de todas as recorrências no mês sem risco de falha.']
        }
      ],
      mensagem: 'Nenhum risco de efeito dominó detectado para os seus cartões.'
    }
    return [200, res]
  }

  // Otimização de Parcelamento
  if (method === 'post' && cleanUrl === '/ia/otimizacao-parcelamento') {
    const res: FolgaLimiteResponse = {
      items: [
        {
          id: 'opt-1',
          cartaoId: 'card-1',
          cartaoNome: 'Nubank Mastercard',
          descricao: 'Sua folga de limite permite antecipar até 2 parcelas de compras sem comprometer o orçamento de despesas fixas.',
          valorParcela: 150.00,
          totalParcelas: 4,
          impactoMensal: 300.00,
          titulo: 'Oportunidade de Quitação Antecipada',
          mensagem: 'Otimização detectada com sucesso!'
        }
      ]
    }
    return [200, res]
  }

  // Endpoints genéricos da IA que retornam mensagens de status
  if (method === 'post' && (
    cleanUrl === '/ia/aviso-fechamento' ||
    cleanUrl === '/ia/melhor-cartao' ||
    cleanUrl === '/ia/insights/cartao' ||
    cleanUrl === '/ia/concentracao-gastos-fatura' ||
    cleanUrl === '/ia/assinaturas/confirmar-classificacao' ||
    cleanUrl === '/ia/assinaturas/classificar-comportamento'
  )) {
    return [200, { success: true, message: 'Análise inteligente concluída no Modo Demo!' }]
  }

  return null
}
