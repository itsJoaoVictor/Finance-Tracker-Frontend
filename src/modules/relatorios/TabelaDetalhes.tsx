interface TabelaDetalhesProps {
  transacoes: any[]
  formatarValor: (valor: number) => string
  formatarData: (data: string) => string
  tipo?: string | null
  pagina: number
  totalPaginas: number
  onPaginaChange: (pagina: number) => void
}

export function TabelaDetalhes({
  transacoes,
  formatarValor,
  formatarData,
  tipo,
  pagina,
  totalPaginas,
  onPaginaChange,
}: TabelaDetalhesProps) {
  if (transacoes.length === 0) {
    return (
      <div className="widget tabela-detalhes">
        <h3>Detalhes das Transações</h3>
        <p className="tabela-detalhes__empty">
          {tipo === 'RECEITA'
            ? 'Nenhuma receita encontrada no período.'
            : 'Nenhuma transação encontrada no período.'}
        </p>
      </div>
    )
  }

  const isDespesa = (tipo: string) =>
    tipo === 'SAQUE' || tipo === 'PIX' || tipo === 'COMPRA_CREDITO'

  return (
    <div className="widget tabela-detalhes">
      <h3>Detalhes das Transações</h3>
      <div className="tabela-detalhes__table-wrapper">
        <table className="tabela-detalhes__table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t: any) => (
              <tr key={t.id}>
                <td>{formatarData(t.data)}</td>
                <td>{t.descricao}</td>
                <td>
                  <span
                    className="tabela-detalhes__categoria-badge"
                    style={{
                      backgroundColor: t.categoriaCorHexadecimal
                        ? t.categoriaCorHexadecimal + '20'
                        : '#f0f0f0',
                      color: t.categoriaCorHexadecimal || '#666',
                    }}
                  >
                    {t.categoriaNome || '-'}
                  </span>
                </td>
                <td>{t.contaOrigemNome || t.contaDestinoNome || '-'}</td>
                <td
                  className={
                    isDespesa(t.tipo)
                      ? 'tabela-detalhes__valor--despesa'
                      : 'tabela-detalhes__valor--receita'
                  }
                >
                  {isDespesa(t.tipo) ? '-' : '+'}
                  {formatarValor(Math.abs(t.valor))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div className="tabela-detalhes__pagination">
          <button
            className="tabela-detalhes__page-btn"
            disabled={pagina <= 0}
            onClick={() => onPaginaChange(pagina - 1)}
          >
            Anterior
          </button>
          <span className="tabela-detalhes__page-info">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            className="tabela-detalhes__page-btn"
            disabled={pagina >= totalPaginas - 1}
            onClick={() => onPaginaChange(pagina + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
