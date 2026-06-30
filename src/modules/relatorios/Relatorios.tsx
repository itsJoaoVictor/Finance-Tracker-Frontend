import { useEffect, useState, useCallback, useMemo } from 'react'
import { relatorioService } from '../../services/relatorioService'
import { transacaoService } from '../../services/transacaoService'
import { RelatorioCategoria, RelatorioFluxoCaixa } from '../../types/relatorio'
import { FiltrosAvancados } from './FiltrosAvancados'
import { GraficoDistribuicaoCategoria } from './GraficoDistribuicaoCategoria'
import { GraficoFluxoCaixa } from './GraficoFluxoCaixa'
import { TabelaDetalhes } from './TabelaDetalhes'
import { ExportarDropdown } from './ExportarDropdown'
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import '../dashboard/dashboard.css'

export function Relatorios() {
  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const [dataInicio, setDataInicio] = useState(inicioMes)
  const [dataFim, setDataFim] = useState(hoje)
  const [categoriasData, setCategoriasData] = useState<RelatorioCategoria | null>(null)
  const [fluxoCaixaData, setFluxoCaixaData] = useState<RelatorioFluxoCaixa[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagina, setPagina] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)

  const carregarDados = useCallback(async () => {
    if (!dataInicio || !dataFim) return
    setLoading(true)
    setError(null)

    try {
      const [catRes, fluxoRes, transRes] = await Promise.all([
        relatorioService.getCategorias({ dataInicio, dataFim }),
        relatorioService.getFluxoCaixa(new Date(dataInicio).getFullYear()),
        transacaoService.getAll({
          dataInicio,
          dataFim,
          page: pagina,
          size: 10,
        }),
      ])

      setCategoriasData(catRes.data)
      setFluxoCaixaData(fluxoRes.data)
      setTransacoes(transRes.data.content)
      setTotalPaginas(transRes.data.totalPages || 0)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [dataInicio, dataFim, pagina])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleExportar = async (formato: 'pdf' | 'csv') => {
    setExportLoading(true)
    try {
      const response = await relatorioService.exportar(formato, dataInicio, dataFim)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-financeiro.${formato}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError('Erro ao exportar relatório')
    } finally {
      setExportLoading(false)
    }
  }

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr)
    return data.toLocaleDateString('pt-BR')
  }

  // Calcular totais do período a partir das transações carregadas
  const totais = useMemo(() => {
    const receitas = transacoes
      .filter((t: any) => t.tipo === 'DEPOSITO')
      .reduce((acc: number, t: any) => acc + Math.abs(t.valor), 0)
    const despesas = transacoes
      .filter((t: any) => t.tipo === 'SAQUE' || t.tipo === 'PIX' || t.tipo === 'COMPRA_CREDITO')
      .reduce((acc: number, t: any) => acc + Math.abs(t.valor), 0)
    return { receitas, despesas, saldo: receitas - despesas }
  }, [transacoes])

  const temDados = transacoes.length > 0 || (categoriasData?.categorias?.length ?? 0) > 0

  return (
    <div className="relatorios">
      <div className="relatorios__toolbar">
        <ExportarDropdown onExportar={handleExportar} loading={exportLoading} />
      </div>

      <FiltrosAvancados
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
      />

      {error && (
        <div className="relatorios__error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="relatorios__loading">
          <Loader2 size={32} className="dashboard__spinner" />
          <p>Carregando relatórios...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {temDados && (
            <div className="relatorios__summary">
              <div className="relatorios__summary-card">
                <div className="relatorios__summary-icon relatorios__summary-icon--receita">
                  <TrendingUp size={22} />
                </div>
                <div className="relatorios__summary-info">
                  <span className="relatorios__summary-label">Receitas</span>
                  <span className="relatorios__summary-value relatorios__summary-value--receita">
                    {formatarValor(totais.receitas)}
                  </span>
                </div>
              </div>
              <div className="relatorios__summary-card">
                <div className="relatorios__summary-icon relatorios__summary-icon--despesa">
                  <TrendingDown size={22} />
                </div>
                <div className="relatorios__summary-info">
                  <span className="relatorios__summary-label">Despesas</span>
                  <span className="relatorios__summary-value relatorios__summary-value--despesa">
                    {formatarValor(totais.despesas)}
                  </span>
                </div>
              </div>
              <div className="relatorios__summary-card">
                <div className="relatorios__summary-icon relatorios__summary-icon--saldo">
                  <DollarSign size={22} />
                </div>
                <div className="relatorios__summary-info">
                  <span className="relatorios__summary-label">Saldo do Período</span>
                  <span className="relatorios__summary-value relatorios__summary-value--saldo">
                    {formatarValor(totais.saldo)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="relatorios__grid">
            <GraficoDistribuicaoCategoria
              categorias={categoriasData?.categorias || []}
              totalConsolidado={categoriasData?.totalConsolidado || 0}
            />
            <GraficoFluxoCaixa dados={fluxoCaixaData} />
            <TabelaDetalhes
              transacoes={transacoes}
              formatarValor={formatarValor}
              formatarData={formatarData}
              pagina={pagina}
              totalPaginas={totalPaginas}
              onPaginaChange={setPagina}
            />
          </div>
        </>
      )}
    </div>
  )
}