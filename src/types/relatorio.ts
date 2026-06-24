export interface RelatorioCategoria {
  periodo: {
    dataInicio: string
    dataFim: string
  }
  totalConsolidado: number
  categorias: CategoriaRelatorio[]
}

export interface CategoriaRelatorio {
  categoriaId: string
  categoriaNome: string
  corHexadecimal: string
  valorTotal: number
  percentual: number
}

export interface RelatorioFluxoCaixa {
  mesReferencia: string
  totalReceitas: number
  totalDespesas: number
  saldoLiquido: number
}