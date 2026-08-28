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
  const [data, setData] = useState<Partial<DashboardResumo>>({})
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState('MES_ATUAL')

  const carregarDados = useCallback(() => {
    setError(null)
    setLoadingPrefs(true)
    // Limpar os dados antigos para mostrar o skeleton de novo
    setData({})

    // 1. Fetch Preferences (bloqueante para renderizar a estrutura)
    dashboardService.getPreferencias()
      .then(res => {
        setData(prev => ({ ...prev, preferenciasLayout: res.data }))
        setLoadingPrefs(false)
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Erro ao carregar preferências')
        setLoadingPrefs(false)
      })

    // 2. Disparar chamadas independentes e parciais
    dashboardService.getKpis(periodo).then(res => setData(prev => ({ ...prev, kpis: res.data }))).catch(console.error)
    dashboardService.getContas(periodo).then(res => setData(prev => ({ ...prev, contas: res.data }))).catch(console.error)
    dashboardService.getCartoes(periodo).then(res => setData(prev => ({ ...prev, cartoes: res.data }))).catch(console.error)
    dashboardService.getProjecao().then(res => setData(prev => ({ ...prev, projetcao15Dias: res.data }))).catch(console.error)
    dashboardService.getTransacoes(periodo).then(res => setData(prev => ({ ...prev, ultimasTransacoes: res.data }))).catch(console.error)
    dashboardService.getInsights().then(res => setData(prev => ({ ...prev, insightsAtivos: res.data }))).catch(console.error)
  }, [periodo])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleDispensarInsight = async (id: string) => {
    try {
      await iaService.marcarComoLido(id)
      setData((prev) => {
        if (!prev.insightsAtivos) return prev
        return {
          ...prev,
          insightsAtivos: prev.insightsAtivos.filter((i) => i.id !== id),
        }
      })
    } catch (err) {
      console.error('Erro ao dispensar insight:', err)
    }
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

  const periodos = [
    { value: 'MES_ATUAL', label: 'Mês Atual' },
    { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 Dias' },
    { value: 'MES_ANTERIOR', label: 'Mês Anterior' },
  ]

  // Render Skeleton Grid
  if (loadingPrefs) {
    return (
      <div className="dashboard">
        <div className="dashboard__toolbar">
          <div className="dashboard__periodo-selector">
            {periodos.map((p) => (
              <span key={p.value} className="dashboard__periodo-btn" style={{ opacity: 0.5 }}>
                {p.label}
              </span>
            ))}
          </div>
        </div>
        <div className="dashboard__skeleton-grid">
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
        </div>
      </div>
    )
  }

  const widgetsOcultos = new Set(data.preferenciasLayout?.widgetsOcultos || [])

  const renderKpis = () => {
    if (widgetsOcultos.has('kpis')) return null;
    if (!data.kpis) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--wide">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="dashboard__skeleton-kpi-row">
            <div className="skeleton dashboard__skeleton-kpi" /><div className="skeleton dashboard__skeleton-kpi" /><div className="skeleton dashboard__skeleton-kpi" />
          </div>
        </div>
      )
    }
    return <KpiWidget kpis={data.kpis} />
  }

  const renderProjecao = () => {
    if (widgetsOcultos.has('fluxoCaixaProjetado')) return null;
    if (!data.projetcao15Dias) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--narrow">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" style={{ height: 40 }} />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--medium" />
        </div>
      )
    }
    return <ProjecaoWidget projecao={data.projetcao15Dias} />
  }

  const renderContasCartoes = () => {
    if (widgetsOcultos.has('cartoes')) return null;
    if (!data.contas || !data.cartoes) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return <ContasCartoesWidget contas={data.contas} cartoes={data.cartoes} />
  }

  const renderInsights = () => {
    if (widgetsOcultos.has('insights')) return null;
    if (!data.insightsAtivos) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return <InsightsFeedWidget insights={data.insightsAtivos} onDispensar={handleDispensarInsight} />
  }

  const renderGraficos = () => {
    if (widgetsOcultos.has('graficoDespesas')) return null;
    if (!data.ultimasTransacoes) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return <GraficosWidget transacoes={data.ultimasTransacoes} />
  }

  const renderTransacoes = () => {
    if (widgetsOcultos.has('ultimasTransacoes')) return null;
    if (!data.ultimasTransacoes) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return <UltimasTransacoesWidget transacoes={data.ultimasTransacoes} />
  }

  return (
    <div className="dashboard">
      <div className="dashboard__toolbar">
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
        {renderKpis()}
        {renderProjecao()}
        {renderContasCartoes()}
        {renderInsights()}
        {renderGraficos()}
        {renderTransacoes()}
      </div>
    </div>
  )
}