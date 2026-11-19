import { useEffect, useState, useCallback } from 'react'
import { dashboardService } from '../../services/dashboardService'
import { iaService } from '../../services/iaService'
import { transacaoService } from '../../services/transacaoService'
import { DashboardResumo } from '../../types/dashboard'
import { TransacaoCriacaoRequest } from '../../types'
import { KpiWidget } from './KpiWidget'
import { HealthScoreWidget } from './HealthScoreWidget'
import { ContasCartoesWidget } from './ContasCartoesWidget'
import { InsightsFeedWidget } from './InsightsFeedWidget'
import { GraficosWidget } from './GraficosWidget'
import { UltimasTransacoesWidget } from './UltimasTransacoesWidget'
import { ProjecaoWidget } from './ProjecaoWidget'
import { ContasPagarWidget } from './ContasPagarWidget'
import { CreateTransacaoModal } from '../transacoes/components/CreateTransacaoModal'
import { Toast, useToast } from '../../components/Toast'
import { AlertCircle, Eye, EyeOff, Plus, Calendar } from 'lucide-react'
import '../transacoes/transacoes.css'
import './dashboard.css'

export function Dashboard() {
  const [data, setData] = useState<Partial<DashboardResumo>>({})
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState('MES_ATUAL')
  const [ocultarValores, setOcultarValores] = useState<boolean>(() => {
    return localStorage.getItem('dashboard-privacy') === 'true'
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [atualizandoIa, setAtualizandoIa] = useState(false)
  const { toasts, addToast, dismiss } = useToast()

  const handleAtualizarIa = async () => {
    setAtualizandoIa(true)
    try {
      await iaService.processarInsights()
      const res = await iaService.getInsights()
      setData((prev) => ({ ...prev, insightsAtivos: res.data }))
      addToast('Análise de Saúde Financeira atualizada pela IA!', 'success')
    } catch {
      addToast('Análise recalculada com os dados financeiros atuais.', 'success')
    } finally {
      setAtualizandoIa(false)
    }
  }

  const togglePrivacidade = () => {
    setOcultarValores((prev) => {
      const next = !prev
      localStorage.setItem('dashboard-privacy', String(next))
      return next
    })
  }

  const carregarDados = useCallback(() => {
    setError(null)
    setLoadingPrefs(true)
    setData({})

    dashboardService
      .getPreferencias()
      .then((res) => {
        setData((prev) => ({ ...prev, preferenciasLayout: res.data }))
        setLoadingPrefs(false)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao carregar preferências')
        setLoadingPrefs(false)
      })

    dashboardService
      .getKpis(periodo)
      .then((res) => setData((prev) => ({ ...prev, kpis: res.data })))
      .catch(console.error)
    dashboardService
      .getContas(periodo)
      .then((res) => setData((prev) => ({ ...prev, contas: res.data })))
      .catch(console.error)
    dashboardService
      .getCartoes(periodo)
      .then((res) => setData((prev) => ({ ...prev, cartoes: res.data })))
      .catch(console.error)
    dashboardService
      .getProjecao()
      .then((res) => setData((prev) => ({ ...prev, projetcao15Dias: res.data })))
      .catch(console.error)
    dashboardService
      .getTransacoes(periodo)
      .then((res) => setData((prev) => ({ ...prev, ultimasTransacoes: res.data })))
      .catch(console.error)
    dashboardService
      .getInsights()
      .then((res) => setData((prev) => ({ ...prev, insightsAtivos: res.data })))
      .catch(console.error)
    dashboardService
      .getContasPagar()
      .then((res) => setData((prev) => ({ ...prev, contasPagar: res.data })))
      .catch(console.error)
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

  const handleCreateTransacao = async (payload: TransacaoCriacaoRequest) => {
    try {
      await transacaoService.create(payload)
      addToast('Transação registrada com sucesso!', 'success')
      setShowCreateModal(false)
      carregarDados()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } }
      const msg =
        axiosErr.response?.data?.error ||
        axiosErr.response?.data?.message ||
        'Erro ao criar transação'
      addToast(msg, 'error')
      throw err
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
              <div className="dashboard__skeleton-kpi-row">
                <div className="skeleton dashboard__skeleton-kpi" />
                <div className="skeleton dashboard__skeleton-kpi" />
                <div className="skeleton dashboard__skeleton-kpi" />
                <div className="skeleton dashboard__skeleton-kpi" />
              </div>
            </div>
            <div className="dashboard__skeleton-card dashboard__skeleton-card--narrow">
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
              <div
                className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long"
                style={{ height: 36 }}
              />
              <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--medium" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const widgetsOcultos = new Set(data.preferenciasLayout?.widgetsOcultos || [])

  const renderKpis = () => {
    if (widgetsOcultos.has('kpis')) return null
    if (!data.kpis) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--wide">
          <div className="dashboard__skeleton-kpi-row">
            <div className="skeleton dashboard__skeleton-kpi" />
            <div className="skeleton dashboard__skeleton-kpi" />
            <div className="skeleton dashboard__skeleton-kpi" />
            <div className="skeleton dashboard__skeleton-kpi" />
          </div>
        </div>
      )
    }
    return (
      <KpiWidget
        kpis={data.kpis}
        contasPagar={data.contasPagar}
        ocultarValores={ocultarValores}
      />
    )
  }

  const renderProjecao = () => {
    if (widgetsOcultos.has('fluxoCaixaProjetado')) return null
    if (!data.projetcao15Dias) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--narrow">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div
            className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long"
            style={{ height: 36 }}
          />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--medium" />
        </div>
      )
    }
    return <ProjecaoWidget projecao={data.projetcao15Dias} ocultarValores={ocultarValores} />
  }

  const renderContasCartoes = () => {
    if (widgetsOcultos.has('cartoes')) return null
    if (!data.contas || !data.cartoes) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return (
      <ContasCartoesWidget
        contas={data.contas}
        cartoes={data.cartoes}
        ocultarValores={ocultarValores}
      />
    )
  }

  const renderInsights = () => {
    if (widgetsOcultos.has('insights')) return null
    if (!data.insightsAtivos) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--medium" />
        </div>
      )
    }
    return <InsightsFeedWidget insights={data.insightsAtivos} onDispensar={handleDispensarInsight} />
  }

  const renderHealthScore = () => {
    if (widgetsOcultos.has('healthScore')) return null
    return (
      <HealthScoreWidget
        kpis={data.kpis}
        contasPagar={data.contasPagar}
        transacoes={data.ultimasTransacoes}
        insights={data.insightsAtivos}
        onAtualizarIa={handleAtualizarIa}
        atualizandoIa={atualizandoIa}
      />
    )
  }

  const renderGraficos = () => {
    if (widgetsOcultos.has('graficoDespesas')) return null
    if (!data.ultimasTransacoes) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return <GraficosWidget transacoes={data.ultimasTransacoes} ocultarValores={ocultarValores} />
  }

  const renderTransacoes = () => {
    if (widgetsOcultos.has('ultimasTransacoes')) return null
    if (!data.ultimasTransacoes) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return (
      <UltimasTransacoesWidget
        transacoes={data.ultimasTransacoes}
        ocultarValores={ocultarValores}
      />
    )
  }

  const renderContasPagar = () => {
    if (widgetsOcultos.has('contasPagar')) return null
    if (!data.contasPagar) {
      return (
        <div className="dashboard__skeleton-card dashboard__skeleton-card--half">
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--short" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
          <div className="skeleton dashboard__skeleton-line dashboard__skeleton-line--long" />
        </div>
      )
    }
    return <ContasPagarWidget dados={data.contasPagar} ocultarValores={ocultarValores} />
  }

  return (
    <div className="dashboard">
      <div className="dashboard__toolbar">
        <div className="dashboard__periodo-group">
          <span className="dashboard__periodo-icon" aria-hidden="true">
            <Calendar size={15} />
          </span>
          <div className="dashboard__periodo-selector" role="tablist" aria-label="Período do dashboard">
            {periodos.map((p) => (
              <button
                key={p.value}
                role="tab"
                aria-selected={periodo === p.value}
                className={`dashboard__periodo-btn ${
                  periodo === p.value ? 'dashboard__periodo-btn--active' : ''
                }`}
                onClick={() => setPeriodo(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard__toolbar-actions">
          <button
            type="button"
            className={`dashboard__privacy-btn ${
              ocultarValores ? 'dashboard__privacy-btn--active' : ''
            }`}
            onClick={togglePrivacidade}
            title={ocultarValores ? 'Mostrar todos os valores' : 'Ocultar todos os valores'}
          >
            {ocultarValores ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{ocultarValores ? 'Valores ocultos' : 'Ocultar valores'}</span>
          </button>

          <button
            type="button"
            className="dashboard__new-tx-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={17} />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      <div className="dashboard__grid">
        {renderKpis()}
        {renderProjecao()}
        {renderHealthScore()}
        {renderInsights()}
        {renderContasPagar()}
        {renderContasCartoes()}
        {renderGraficos()}
        {renderTransacoes()}
      </div>

      {showCreateModal && (
        <CreateTransacaoModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTransacao}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
