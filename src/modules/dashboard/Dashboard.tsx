import { useEffect, useState, useCallback } from 'react'
import { dashboardService } from '../../services/dashboardService'
import { iaService } from '../../services/iaService'
import { DashboardResumo } from '../../types/dashboard'
import { KpiWidget } from './KpiWidget'
import { ContasCartoesWidget } from './ContasCartoesWidget'
import { InsightsFeedWidget } from './InsightsFeedWidget'
import { GraficosWidget } from './GraficosWidget'
import { UltimasTransacoesWidget } from './UltimasTransacoesWidget'
import { ProjecaoWidget } from './ProjecaoWidget'
import { AlertCircle } from 'lucide-react'
import './dashboard.css'

export function Dashboard() {
  const [data, setData] = useState<DashboardResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState('MES_ATUAL')

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dashboardService.getResumo(periodo)
      setData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleDispensarInsight = async (id: string) => {
    try {
      await iaService.marcarComoLido(id)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          insightsAtivos: prev.insightsAtivos.filter((i) => i.id !== id),
        }
      })
    } catch (err) {
      console.error('Erro ao dispensar insight:', err)
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__toolbar">
          <h2 className="dashboard__title">Dashboard</h2>
          <div className="dashboard__periodo-selector">
            {['Mês Atual', 'Últimos 30 Dias', 'Mês Anterior'].map((label) => (
              <span key={label} className="dashboard__periodo-btn" style={{ opacity: 0.5 }}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="dashboard__skeleton-grid">
          {/* Z-Pattern Row 1: KPIs + Projeção */}
          <div className="dashboard__skeleton-row">
            <div className="dashboard__skeleton-card dashboard__skeleton-card--wide">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div className="dashboard__skeleton-kpi-row">
                <div className="skeleton dashboard__skeleton-kpi" />
                <div className="skeleton dashboard__skeleton-kpi" />
                <div className="skeleton dashboard__skeleton-kpi" />
              </div>
            </div>
            <div className="dashboard__skeleton-card dashboard__skeleton-card--narrow">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" style={{ height: 40 }} />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--medium" />
            </div>
          </div>
          {/* Z-Pattern Row 2: Contas + Insights */}
          <div className="dashboard__skeleton-row">
            <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
            </div>
            <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
            </div>
          </div>
          {/* Z-Pattern Row 3: Transações + Gráficos */}
          <div className="dashboard__skeleton-row">
            <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
            </div>
            <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard__error">
        <AlertCircle size={32} />
        <p>{error}</p>
        <button className="dashboard__retry" onClick={carregarDados}>
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) return null

  // Filtros de período
  const periodos = [
    { value: 'MES_ATUAL', label: 'Mês Atual' },
    { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 Dias' },
    { value: 'MES_ANTERIOR', label: 'Mês Anterior' },
  ]

  // Widgets com visibilidade baseada nas preferências
  const widgetsOcultos = new Set(data.preferenciasLayout.widgetsOcultos || [])

  return (
    <div className="dashboard">
      <div className="dashboard__toolbar">
        <h2 className="dashboard__title">Dashboard</h2>
        <div className="dashboard__periodo-selector">
          {periodos.map((p) => (
            <button
              key={p.value}
              className={`dashboard__periodo-btn ${periodo === p.value ? 'dashboard__periodo-btn--active' : ''}`}
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard__grid">
        {!widgetsOcultos.has('kpis') && <KpiWidget kpis={data.kpis} />}
        {!widgetsOcultos.has('fluxoCaixaProjetado') && (
          <ProjecaoWidget projecao={data.projetcao15Dias} />
        )}
        {!widgetsOcultos.has('cartoes') && (
          <ContasCartoesWidget contas={data.contas} cartoes={data.cartoes} />
        )}
        {!widgetsOcultos.has('insights') && (
          <InsightsFeedWidget
            insights={data.insightsAtivos}
            onDispensar={handleDispensarInsight}
          />
        )}
        {!widgetsOcultos.has('graficoDespesas') && (
          <GraficosWidget transacoes={data.ultimasTransacoes} />
        )}
        {!widgetsOcultos.has('ultimasTransacoes') && (
          <UltimasTransacoesWidget transacoes={data.ultimasTransacoes} />
        )}
      </div>
    </div>
  )
}