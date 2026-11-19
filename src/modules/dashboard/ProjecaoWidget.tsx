import { useMemo } from 'react'
import { CalendarRange, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'

interface ProjecaoWidgetProps {
  projecao: DashboardResumo['projetcao15Dias']
  saldoAtual?: number
  contasPagar?: DashboardResumo['contasPagar']
  ocultarValores?: boolean
}

export function ProjecaoWidget({
  projecao,
  saldoAtual = 0,
  contasPagar,
  ocultarValores = false,
}: ProjecaoWidgetProps) {
  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const getStatusClass = () => {
    switch (projecao.status) {
      case 'CRITICO':
        return 'projecao-widget--critico'
      case 'ATENCAO':
        return 'projecao-widget--atencao'
      default:
        return 'projecao-widget--ok'
    }
  }

  const getStatusLabel = () => {
    switch (projecao.status) {
      case 'CRITICO':
        return 'Saldo Negativo Projetado'
      case 'ATENCAO':
        return 'Atenção no Fluxo'
      default:
        return 'Situação Estável'
    }
  }

  const getStatusIcon = () => {
    switch (projecao.status) {
      case 'CRITICO':
        return <ShieldAlert size={16} />
      case 'ATENCAO':
        return <AlertTriangle size={16} />
      default:
        return <ShieldCheck size={16} />
    }
  }

  // Calcula o total de contas que impactam os próximos 15 dias
  const totalContasProximas = useMemo(() => {
    if (contasPagar?.totalPendenteMes && contasPagar.totalPendenteMes > 0) {
      return contasPagar.totalPendenteMes
    }
    // Se não houver pendente do mês, calcula a diferença entre o saldo atual e o saldo projetado
    const diff = saldoAtual - projecao.saldoProjetado
    return diff > 0 ? diff : 0
  }, [contasPagar, saldoAtual, projecao.saldoProjetado])

  // Frase explicativa limpa e sem duplicações esquisitas de texto
  const explicacaoLimpa = useMemo(() => {
    if (projecao.status === 'CRITICO' || projecao.saldoProjetado < 0) {
      return `Contas a pagar de ${formatar(totalContasProximas)} vencem no período e superam seu saldo em conta.`
    }
    if (projecao.status === 'ATENCAO') {
      return `Contas de ${formatar(totalContasProximas)} vencem em breve, deixando sua margem de segurança apertada.`
    }
    return 'Seu saldo atual cobre com tranquilidade todas as contas previstas para os próximos 15 dias.'
  }, [projecao.status, projecao.saldoProjetado, totalContasProximas, ocultarValores])

  return (
    <div className={`widget projecao-widget ${getStatusClass()}`}>
      <div className="projecao-widget__header">
        <div className="projecao-widget__title-group">
          <CalendarRange size={18} className="projecao-widget__title-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>Projeção para 15 Dias</h3>
        </div>
        <div className="projecao-widget__badge">
          <span className="projecao-widget__status-dot" />
          {getStatusIcon()}
          <span className="projecao-widget__status-text">{getStatusLabel()}</span>
        </div>
      </div>

      <div className="projecao-widget__content">
        <div className="projecao-widget__saldo">
          <span className="projecao-widget__label">Saldo Projetado</span>
          <span className="projecao-widget__valor">{formatar(projecao.saldoProjetado)}</span>
        </div>

        {/* Resumo visual do cálculo da projeção (elimina o espaço vazio no card) */}
        <div className="projecao-widget__breakdown">
          <div className="projecao-widget__breakdown-item">
            <span className="projecao-widget__breakdown-label">Saldo em contas</span>
            <span className="projecao-widget__breakdown-val">{formatar(saldoAtual)}</span>
          </div>

          <div className="projecao-widget__breakdown-sep" />

          <div className="projecao-widget__breakdown-item">
            <span className="projecao-widget__breakdown-label">Contas a pagar (15d)</span>
            <span className="projecao-widget__breakdown-val projecao-widget__breakdown-val--neg">
              - {formatar(totalContasProximas)}
            </span>
          </div>
        </div>

        <p className="projecao-widget__mensagem">{explicacaoLimpa}</p>
      </div>
    </div>
  )
}
