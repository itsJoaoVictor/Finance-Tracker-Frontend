import {
  Category,
  Conta,
  Cartao,
  Fatura,
  Transacao,
  MetaEconomia,
  Orcamento,
  Assinatura,
  Tag,
  Agendamento
} from '../../types'
import { DesejoCompra } from '../desejoCompraService'
import { IaInsight } from '../iaService'

const getRelativeDate = (day: number, monthOffset = 0): string => {
  const date = new Date()
  date.setMonth(date.getMonth() + monthOffset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayStr = String(Math.min(day, 28)).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

const getMonthYear = (monthOffset = 0): string => {
  const date = new Date()
  date.setMonth(date.getMonth() + monthOffset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const defaultUser = {
  id: 'demo-user-id',
  name: 'Usuário Demo Portfólio',
  email: 'demo@portifolio.com'
}

export const defaultCategories: Category[] = [
  { id: 'cat-1', usuarioId: null, nome: 'Alimentação', icone: 'utensils', corHexadecimal: '#EF4444', ativo: true },
  { id: 'cat-2', usuarioId: null, nome: 'Moradia', icone: 'home', corHexadecimal: '#F97316', ativo: true },
  { id: 'cat-3', usuarioId: null, nome: 'Transporte', icone: 'car', corHexadecimal: '#EAB308', ativo: true },
  { id: 'cat-4', usuarioId: null, nome: 'Lazer', icone: 'gamepad', corHexadecimal: '#A855F7', ativo: true },
  { id: 'cat-5', usuarioId: null, nome: 'Salário', icone: 'wallet', corHexadecimal: '#22C55E', ativo: true },
  { id: 'cat-6', usuarioId: null, nome: 'Investimentos', icone: 'trending-up', corHexadecimal: '#3B82F6', ativo: true },
  { id: 'cat-7', usuarioId: null, nome: 'Saúde', icone: 'heart', corHexadecimal: '#EC4899', ativo: true },
  { id: 'cat-8', usuarioId: null, nome: 'Educação', icone: 'book', corHexadecimal: '#06B6D4', ativo: true }
]

export const defaultContas: Conta[] = [
  { id: 'acc-1', nome: 'NuConta Corrente', tipo: 'CORRENTE', saldo: 4250.00, corHexadecimal: '#8B5CF6', contaPadrao: true },
  { id: 'acc-2', nome: 'Poupança Caixa', tipo: 'POUPANCA', saldo: 12800.00, corHexadecimal: '#3B82F6', contaPadrao: false },
  { id: 'acc-3', nome: 'Carteira XP Investimentos', tipo: 'POUPANCA', saldo: 35000.00, corHexadecimal: '#F59E0B', contaPadrao: false }
]

export const defaultCartoes: Cartao[] = [
  {
    id: 'card-1',
    nome: 'Nubank Mastercard',
    limite: 8000.00,
    limiteDisponivel: 6450.00,
    diaFechamento: 5,
    diaVencimento: 12,
    contaId: 'acc-1',
    corHexadecimal: '#8B5CF6',
    faturaEstimada: 1550.00,
    faturaStatus: 'ABERTA'
  },
  {
    id: 'card-2',
    nome: 'XP Visa Infinite',
    limite: 25000.00,
    limiteDisponivel: 23200.00,
    diaFechamento: 15,
    diaVencimento: 22,
    contaId: 'acc-1',
    corHexadecimal: '#1E293B',
    faturaEstimada: 1800.00,
    faturaStatus: 'ABERTA'
  }
]

export const defaultFaturas: Fatura[] = [
  {
    id: 'fat-1-cur',
    mesReferencia: getMonthYear(0),
    dataFechamento: getRelativeDate(5, 0),
    dataVencimento: getRelativeDate(12, 0),
    valorTotal: 1550.00,
    valorPago: 0,
    status: 'ABERTA'
  },
  {
    id: 'fat-1-prev',
    mesReferencia: getMonthYear(-1),
    dataFechamento: getRelativeDate(5, -1),
    dataVencimento: getRelativeDate(12, -1),
    valorTotal: 2100.00,
    valorPago: 2100.00,
    status: 'PAGA'
  },
  {
    id: 'fat-2-cur',
    mesReferencia: getMonthYear(0),
    dataFechamento: getRelativeDate(15, 0),
    dataVencimento: getRelativeDate(22, 0),
    valorTotal: 1800.00,
    valorPago: 0,
    status: 'ABERTA'
  }
]

export const defaultTransacoes: Transacao[] = [
  {
    id: 'tr-1',
    descricao: 'Salário da Empresa',
    valor: 5500.00,
    tipo: 'DEPOSITO',
    contaDestinoId: 'acc-1',
    contaDestinoNome: 'NuConta Corrente',
    categoriaId: 'cat-5',
    categoriaNome: 'Salário',
    data: getRelativeDate(5, 0),
    estornada: false
  },
  {
    id: 'tr-2',
    descricao: 'Aluguel e Condomínio',
    valor: 2100.00,
    tipo: 'SAQUE',
    contaOrigemId: 'acc-1',
    contaOrigemNome: 'NuConta Corrente',
    categoriaId: 'cat-2',
    categoriaNome: 'Moradia',
    data: getRelativeDate(6, 0),
    estornada: false
  },
  {
    id: 'tr-3',
    descricao: 'Supermercado Pão de Açúcar',
    valor: 680.50,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-1',
    categoriaNome: 'Alimentação',
    data: getRelativeDate(7, 0),
    estornada: false
  },
  {
    id: 'tr-4',
    descricao: 'Jantar Outback',
    valor: 245.00,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-1',
    categoriaNome: 'Alimentação',
    data: getRelativeDate(10, 0),
    estornada: false
  },
  {
    id: 'tr-5',
    descricao: 'Posto Ipiranga Gasolina',
    valor: 220.00,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-3',
    categoriaNome: 'Transporte',
    data: getRelativeDate(11, 0),
    estornada: false
  },
  {
    id: 'tr-6',
    descricao: 'Uber Viagens',
    valor: 48.90,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-3',
    categoriaNome: 'Transporte',
    data: getRelativeDate(12, 0),
    estornada: false
  },
  {
    id: 'tr-7',
    descricao: 'Netflix 4K',
    valor: 55.90,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-4',
    categoriaNome: 'Lazer',
    data: getRelativeDate(10, 0),
    estornada: false
  },
  {
    id: 'tr-8',
    descricao: 'Spotify Premium',
    valor: 21.90,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-4',
    categoriaNome: 'Lazer',
    data: getRelativeDate(15, 0),
    estornada: false
  },
  {
    id: 'tr-9',
    descricao: 'Gympass Academia',
    valor: 119.90,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-1',
    faturaId: 'fat-1-cur',
    categoriaId: 'cat-7',
    categoriaNome: 'Saúde',
    data: getRelativeDate(20, 0),
    estornada: false
  },
  {
    id: 'tr-10',
    descricao: 'Livros Amazon',
    valor: 179.90,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-2',
    faturaId: 'fat-2-cur',
    categoriaId: 'cat-8',
    categoriaNome: 'Educação',
    data: getRelativeDate(8, 0),
    estornada: false
  },
  {
    id: 'tr-11',
    descricao: 'Restaurante Japonês',
    valor: 180.00,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-2',
    faturaId: 'fat-2-cur',
    categoriaId: 'cat-1',
    categoriaNome: 'Alimentação',
    data: getRelativeDate(14, 0),
    estornada: false
  },
  {
    id: 'tr-12',
    descricao: 'Aporte Tesouro Direto',
    valor: 1000.00,
    tipo: 'TRANSFERENCIA',
    contaOrigemId: 'acc-1',
    contaOrigemNome: 'NuConta Corrente',
    contaDestinoId: 'acc-3',
    contaDestinoNome: 'Carteira XP Investimentos',
    categoriaId: 'cat-6',
    categoriaNome: 'Investimentos',
    data: getRelativeDate(15, 0),
    estornada: false
  },
  {
    id: 'tr-13',
    descricao: 'Farmácia Droga Raia',
    valor: 85.40,
    tipo: 'SAQUE',
    contaOrigemId: 'acc-1',
    contaOrigemNome: 'NuConta Corrente',
    categoriaId: 'cat-7',
    categoriaNome: 'Saúde',
    data: getRelativeDate(16, 0),
    estornada: false
  },
  {
    id: 'tr-14',
    descricao: 'Cinema Cinemark',
    valor: 78.00,
    tipo: 'COMPRA_CREDITO',
    cartaoId: 'card-2',
    faturaId: 'fat-2-cur',
    categoriaId: 'cat-4',
    categoriaNome: 'Lazer',
    data: getRelativeDate(18, 0),
    estornada: false
  },
  {
    id: 'tr-15',
    descricao: 'Rendimento Poupança',
    valor: 112.50,
    tipo: 'DEPOSITO',
    contaDestinoId: 'acc-2',
    contaDestinoNome: 'Poupança Caixa',
    categoriaId: 'cat-6',
    categoriaNome: 'Investimentos',
    data: getRelativeDate(1, 0),
    estornada: false
  }
]

export const defaultMetas: MetaEconomia[] = [
  {
    id: 'meta-1',
    nome: 'Reserva de Emergência',
    valorAlvo: 30000.00,
    valorAcumulado: 18500.00,
    contaVinculadaId: 'acc-2',
    criadoEm: getRelativeDate(1, -6)
  },
  {
    id: 'meta-2',
    nome: 'Viagem para Europa 2027',
    valorAlvo: 20000.00,
    valorAcumulado: 6200.00,
    contaVinculadaId: 'acc-3',
    criadoEm: getRelativeDate(1, -3)
  },
  {
    id: 'meta-3',
    nome: 'Trocar de Carro',
    valorAlvo: 50000.00,
    valorAcumulado: 12000.00,
    contaVinculadaId: 'acc-2',
    criadoEm: getRelativeDate(1, -8)
  }
]

export const defaultOrcamentos: Orcamento[] = [
  { id: 'orc-1', categoriaId: 'cat-1', limiteMensal: 1500.00 },
  { id: 'orc-2', categoriaId: 'cat-4', limiteMensal: 600.00 },
  { id: 'orc-3', categoriaId: 'cat-3', limiteMensal: 500.00 },
  { id: 'orc-4', categoriaId: 'cat-7', limiteMensal: 400.00 }
]

export const defaultAssinaturas: Assinatura[] = [
  {
    id: 'ass-1',
    nome: 'Netflix 4K',
    valor: 55.90,
    cartaoId: 'card-1',
    categoriaId: 'cat-4',
    tipoRecorrencia: 'MENSAL',
    diaCobranca: 10,
    dataInicio: getRelativeDate(10, -6),
    dataProximaCobranca: getRelativeDate(10, 1),
    ativo: true
  },
  {
    id: 'ass-2',
    nome: 'Spotify Premium',
    valor: 21.90,
    cartaoId: 'card-1',
    categoriaId: 'cat-4',
    tipoRecorrencia: 'MENSAL',
    diaCobranca: 15,
    dataInicio: getRelativeDate(15, -12),
    dataProximaCobranca: getRelativeDate(15, 1),
    ativo: true
  },
  {
    id: 'ass-3',
    nome: 'Gympass Academia',
    valor: 119.90,
    cartaoId: 'card-1',
    categoriaId: 'cat-7',
    tipoRecorrencia: 'MENSAL',
    diaCobranca: 20,
    dataInicio: getRelativeDate(20, -4),
    dataProximaCobranca: getRelativeDate(20, 1),
    ativo: true
  },
  {
    id: 'ass-4',
    nome: 'Amazon Prime',
    valor: 14.90,
    cartaoId: 'card-2',
    categoriaId: 'cat-4',
    tipoRecorrencia: 'MENSAL',
    diaCobranca: 2,
    dataInicio: getRelativeDate(2, -8),
    dataProximaCobranca: getRelativeDate(2, 1),
    ativo: true
  }
]

export const defaultDesejos: DesejoCompra[] = [
  { id: 'des-1', nome: 'MacBook Pro M3 Max', valor: 14500.00 },
  { id: 'des-2', nome: 'PlayStation 5 Pro', valor: 4500.00 },
  { id: 'des-3', nome: 'Cadeira Herman Miller Aeron', valor: 6800.00 }
]

export const defaultAgendamentos: Agendamento[] = [
  {
    id: 'agd-1',
    descricao: 'Aluguel e Condomínio',
    valor: 2100.00,
    tipo: 'SAQUE',
    contaOrigemId: 'acc-1',
    categoriaId: 'cat-2',
    recorrencia: 'MENSAL',
    diaExecucao: 5,
    dataInicio: getRelativeDate(5, -6),
    dataProximaExecucao: getRelativeDate(5, 1),
    ativo: true
  },
  {
    id: 'agd-2',
    descricao: 'Internet Fibra Ótica',
    valor: 139.90,
    tipo: 'SAQUE',
    contaOrigemId: 'acc-1',
    categoriaId: 'cat-2',
    recorrencia: 'MENSAL',
    diaExecucao: 10,
    dataInicio: getRelativeDate(10, -6),
    dataProximaExecucao: getRelativeDate(10, 1),
    ativo: true
  }
]

export const defaultTags: Tag[] = [
  { id: 'tag-1', nome: '#fixo', corHexadecimal: '#EF4444' },
  { id: 'tag-2', nome: '#lazer', corHexadecimal: '#A855F7' },
  { id: 'tag-3', nome: '#viagem', corHexadecimal: '#3B82F6' },
  { id: 'tag-4', nome: '#trabalho', corHexadecimal: '#10B981' }
]

export const defaultInsightsIa: IaInsight[] = [
  {
    id: 'ins-1',
    tipo: 'ALERTA_GASTO',
    titulo: 'Consumo Elevado em Alimentação',
    mensagem: 'Você já utilizou R$ 1.105,50 no mês em Alimentação (Supermercados e Restaurantes). Isso representa 73% do seu orçamento mensal previsto para esta categoria.',
    criadoEm: getRelativeDate(2, 0),
    lido: false,
    relevante: true
  },
  {
    id: 'ins-2',
    tipo: 'OTIMIZACAO',
    titulo: 'Análise de Assinaturas Ativas',
    mensagem: 'Notamos 4 serviços de streaming/recorrência ativos somando R$ 212,60/mês. Verifique no módulo de assinaturas se existe alguma cobrança por serviço pouco utilizado.',
    criadoEm: getRelativeDate(5, 0),
    lido: false,
    relevante: true
  },
  {
    id: 'ins-3',
    tipo: 'PARABENS',
    titulo: 'Saúde Financeira Excelente',
    mensagem: 'Parabéns! Suas receitas superam suas despesas fixas em mais de 50%. Excelente momento para realizar aportes na sua meta de "Reserva de Emergência".',
    criadoEm: getRelativeDate(10, 0),
    lido: true,
    relevante: true
  }
]
