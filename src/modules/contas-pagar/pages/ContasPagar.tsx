import { useCallback, useEffect, useMemo, useState } from 'react'
import { contaPagarService } from '../../../services/contaPagarService'
import {
  ContaPagarModelo,
  ContaPagarOcorrencia,
  FinanciamentoResumo,
  GradeMensalResponse,
  TipoContaPagar,
} from '../../../types/contasPagar'
import { Toast, useToast } from '../../../components/Toast'
import { ModeloModal } from '../components/ModeloModal'
import { OcorrenciaDrawer } from '../components/OcorrenciaDrawer'
import { FinanciamentoModal } from '../components/FinanciamentoModal'
import { FinanciamentoProjetoModal } from '../components/FinanciamentoProjetoModal'
import { VincularItensModal } from '../components/VincularItensModal'
import { NotificacaoConfigModal } from '../components/NotificacaoConfigModal'
import {
  Plus,
  Table2,
  ListChecks,
  Building2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Zap,
  Link2,
  Unlink,
  CheckCircle2,
} from 'lucide-react'
import '../../contas/contas.css'
import '../contasPagar.css'

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatMesLabel(isoDate: string): string {
  const [y, m] = isoDate.split('-')
  const idx = parseInt(m, 10) - 1
  return `${MESES_NOMES[idx] || m}/${y.slice(2)}`
}

function addMonths(isoFirstDay: string, delta: number): string {
  const [y, m] = isoFirstDay.split('-').map((n) => parseInt(n, 10))
  const d = new Date(y, m - 1 + delta, 1)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${yy}-${mm}-01`
}

function formatIntervaloLabel(intervalo?: number): string | null {
  if (!intervalo || intervalo <= 1) return null
  if (intervalo === 2) return 'Bimestral'
  if (intervalo === 3) return 'Trimestral'
  if (intervalo === 6) return 'Semestral'
  if (intervalo === 12) return 'Anual'
  return `A cada ${intervalo} meses`
}

function formatModoParcelamentoLabel(m: ContaPagarModelo): string {
  if (m.modoParcelamento === 'PROGRESSIVO') {
    if (m.valorPadrao != null && m.valorUltimaParcela != null) {
      if (m.valorUltimaParcela < m.valorPadrao) return 'Progressivo ↓ (SAC)'
      if (m.valorUltimaParcela > m.valorPadrao) return 'Progressivo ↑'
    }
    return 'Progressivo'
  }
  if (m.modoParcelamento === 'PERSONALIZADO') return 'Personalizado'
  return 'Fixo (Price)'
}

export function ContasPagar() {
  const now = new Date()
  const mesAtualIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [aba, setAba] = useState<'GRADE' | 'MES' | 'FINANCIAMENTOS'>('GRADE')
  const [mesInicioGrade, setMesInicioGrade] = useState(() => addMonths(mesAtualIso, -1))
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualIso)
  const [agrupador, setAgrupador] = useState<string>('TODOS')

  const [grade, setGrade] = useState<GradeMensalResponse | null>(null)
  const [financiamentos, setFinanciamentos] = useState<FinanciamentoResumo[]>([])
  const [loading, setLoading] = useState(true)

  const [showModeloModal, setShowModeloModal] = useState(false)
  const [modeloEditar, setModeloEditar] = useState<ContaPagarModelo | null>(null)
  const [modeloFinanciamentoInicialId, setModeloFinanciamentoInicialId] = useState<string | null>(null)
  const [modeloTipoInicial, setModeloTipoInicial] = useState<TipoContaPagar | undefined>(undefined)
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState<ContaPagarOcorrencia | null>(null)
  const [financiamentoModeloId, setFinanciamentoModeloId] = useState<string | null>(null)
  const [showFinProjetoModal, setShowFinProjetoModal] = useState(false)
  const [finProjetoEditar, setFinProjetoEditar] = useState<FinanciamentoResumo | null>(null)
  const [finParaVincular, setFinParaVincular] = useState<FinanciamentoResumo | null>(null)
  const [showNotifModal, setShowNotifModal] = useState(false)

  const { toasts, addToast, dismiss } = useToast()
  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' = 'success') => addToast(msg, type),
    [addToast],
  )

  const mesFimGrade = useMemo(() => addMonths(mesInicioGrade, 5), [mesInicioGrade])

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const inicio = aba === 'MES' ? mesSelecionado : mesInicioGrade
      const fim = aba === 'MES' ? mesSelecionado : mesFimGrade
      const [gradeRes, finRes] = await Promise.all([
        contaPagarService.obterGrade({
          mesInicio: inicio,
          mesFim: fim,
          agrupador: agrupador === 'TODOS' ? undefined : agrupador,
        }),
        contaPagarService.listarFinanciamentos(),
      ])
      setGrade(gradeRes.data)
      setFinanciamentos(finRes.data || [])
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao carregar Contas a Pagar.', 'error')
    } finally {
      setLoading(false)
    }
  }, [aba, mesInicioGrade, mesFimGrade, mesSelecionado, agrupador, showToast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const formatarMoeda = (v?: number | null) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const handleExcluirModelo = async (m: ContaPagarModelo) => {
    if (!window.confirm(`Deseja desativar "${m.nome}"? As ocorrências futuras não pagas serão canceladas e o histórico pago será mantido.`)) {
      return
    }
    try {
      await contaPagarService.excluirModelo(m.id)
      showToast('Conta desativada com sucesso.', 'success')
      carregarDados()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao excluir conta.', 'error')
    }
  }

  const ocorrenciasDoMesSelecionado = useMemo(() => {
    if (!grade) return []
    const list: ContaPagarOcorrencia[] = []
    for (const linha of grade.linhas) {
      for (const cel of linha.celulas) {
        if (cel && cel.mesReferencia === mesSelecionado) {
          list.push(cel)
        }
      }
    }
    return list.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
  }, [grade, mesSelecionado])

  const handleExcluirFinanciamento = async (f: FinanciamentoResumo) => {
    if (
      !window.confirm(
        `Remover o financiamento "${f.nome}"? Suas contas, boletos e transações NÃO serão apagados — apenas desvinculados.`,
      )
    ) {
      return
    }
    try {
      await contaPagarService.excluirFinanciamento(f.id)
      showToast('Financiamento removido (boletos e transações mantidos).', 'success')
      carregarDados()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao remover financiamento.', 'error')
    }
  }

  const handleDesvincularModelo = async (finId: string, modeloId: string, nome: string) => {
    if (!window.confirm(`Desvincular "${nome}" deste financiamento? A conta continuará existindo normalmente.`)) {
      return
    }
    try {
      await contaPagarService.desvincularModeloFinanciamento(finId, modeloId)
      showToast('Conta desvinculada do financiamento.', 'success')
      carregarDados()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao desvincular conta.', 'error')
    }
  }

  const handleDesvincularTransacao = async (finId: string, txId: string, desc: string) => {
    if (!window.confirm(`Desvincular a transação "${desc}" deste financiamento?`)) {
      return
    }
    try {
      await contaPagarService.desvincularTransacaoFinanciamento(finId, txId)
      showToast('Transação desvinculada.', 'success')
      carregarDados()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao desvincular transação.', 'error')
    }
  }

  const modelosParcelados = useMemo(() => {
    if (!grade) return []
    return grade.linhas.map((l) => l.modelo).filter((m) => m.tipo === 'PARCELADO')
  }, [grade])

  const modelosParceladosSoltos = useMemo(() => {
    return modelosParcelados.filter((m) => !m.financiamentoId)
  }, [modelosParcelados])

  return (
    <div className="contas-pagar">
      {/* Cabeçalho e Ações */}
      <div className="contas-pagar__header">
        <div className="contas-pagar__tabs">
          <button
            type="button"
            className={`contas-pagar__tab ${aba === 'GRADE' ? 'contas-pagar__tab--active' : ''}`}
            onClick={() => setAba('GRADE')}
          >
            <Table2 size={16} /> Grade Mês a Mês
          </button>
          <button
            type="button"
            className={`contas-pagar__tab ${aba === 'MES' ? 'contas-pagar__tab--active' : ''}`}
            onClick={() => setAba('MES')}
          >
            <ListChecks size={16} /> Lista do Mês
          </button>
          <button
            type="button"
            className={`contas-pagar__tab ${aba === 'FINANCIAMENTOS' ? 'contas-pagar__tab--active' : ''}`}
            onClick={() => setAba('FINANCIAMENTOS')}
          >
            <Building2 size={16} /> Financiamentos ({financiamentos.length > 0 ? financiamentos.length : modelosParcelados.length})
          </button>
        </div>

        <div className="contas-pagar__controls">
          <button
            type="button"
            className="contas-pagar__btn"
            onClick={() => setShowNotifModal(true)}
            title="Configurar alertas Telegram e Web Push"
          >
            <Bell size={16} /> Alertas
          </button>
          <button
            type="button"
            className="contas-pagar__btn contas-pagar__btn--primary"
            onClick={() => {
              setModeloEditar(null)
              setModeloFinanciamentoInicialId(null)
              setModeloTipoInicial(undefined)
              setShowModeloModal(true)
            }}
          >
            <Plus size={16} /> Nova Conta / Parcelamento
          </button>
        </div>
      </div>

      {/* Filtro por Agrupador (Imóvel) + Navegação de Período */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="contas-pagar__agrupadores">
          <span className="contas-pagar__agrupadores-label">Imóvel / Agrupador:</span>
          <button
            type="button"
            className={`contas-pagar__chip ${agrupador === 'TODOS' ? 'contas-pagar__chip--active' : ''}`}
            onClick={() => setAgrupador('TODOS')}
          >
            Todos
          </button>
          {(grade?.agrupadores || []).map((ag) => (
            <button
              key={ag}
              type="button"
              className={`contas-pagar__chip ${agrupador === ag ? 'contas-pagar__chip--active' : ''}`}
              onClick={() => setAgrupador(ag)}
            >
              {ag}
            </button>
          ))}
        </div>

        {aba === 'GRADE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="contas-pagar__btn"
              onClick={() => setMesInicioGrade((m) => addMonths(m, -3))}
            >
              <ChevronLeft size={16} /> -3 meses
            </button>
            <button
              type="button"
              className="contas-pagar__btn"
              onClick={() => setMesInicioGrade(addMonths(mesAtualIso, -1))}
            >
              Hoje
            </button>
            <button
              type="button"
              className="contas-pagar__btn"
              onClick={() => setMesInicioGrade((m) => addMonths(m, 3))}
            >
              +3 meses <ChevronRight size={16} />
            </button>
          </div>
        )}

        {aba === 'MES' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="contas-pagar__btn"
              onClick={() => setMesSelecionado((m) => addMonths(m, -1))}
            >
              <ChevronLeft size={16} />
            </button>
            <strong style={{ minWidth: '90px', textAlign: 'center' }}>
              {formatMesLabel(mesSelecionado)}
            </strong>
            <button
              type="button"
              className="contas-pagar__btn"
              onClick={() => setMesSelecionado((m) => addMonths(m, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Legenda de Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="contas-pagar__legend">
          <span className="contas-pagar__legend-item">
            <span className="contas-pagar__dot" style={{ background: '#27ae60' }} /> Paga
          </span>
          <span className="contas-pagar__legend-item">
            <span className="contas-pagar__dot" style={{ background: '#d68910' }} /> Pendente (valor confirmado)
          </span>
          <span className="contas-pagar__legend-item">
            <span className="contas-pagar__dot" style={{ background: '#7f8c8d' }} /> Aguardando valor (~ estimado)
          </span>
          <span className="contas-pagar__legend-item">
            <span className="contas-pagar__dot" style={{ background: '#e74c3c' }} /> Atrasada
          </span>
          <span className="contas-pagar__legend-item">
            <span className="contas-pagar__dot" style={{ background: '#555' }} /> Cancelada
          </span>
        </div>

        {grade && grade.totalJurosAno > 0 && (
          <div style={{ fontSize: '0.8rem', color: '#e67e22', fontWeight: 600 }}>
            Juros/Multas pagos no ano: {formatarMoeda(grade.totalJurosAno)}
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      {loading || !grade ? (
        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>
          Carregando controle mensal de contas...
        </div>
      ) : aba !== 'FINANCIAMENTOS' && grade.linhas.length === 0 ? (
        <div
          className="cp-card"
          style={{ padding: '40px', textAlign: 'center', alignItems: 'center', gap: '12px' }}
        >
          <h3 style={{ margin: 0 }}>Nenhuma conta a pagar cadastrada</h3>
          <p style={{ margin: 0, opacity: 0.75, maxWidth: '460px' }}>
            Cadastre suas contas de consumo (Água, Luz), contas fixas (Condomínio, Internet) ou o
            Financiamento do seu imóvel para controlar mês a mês o que já foi pago.
          </p>
          <button
            type="button"
            className="contas-pagar__btn contas-pagar__btn--primary"
            onClick={() => {
              setModeloEditar(null)
              setModeloFinanciamentoInicialId(null)
              setModeloTipoInicial(undefined)
              setShowModeloModal(true)
            }}
          >
            <Plus size={16} /> Cadastrar Primeira Conta
          </button>
        </div>
      ) : aba === 'GRADE' ? (
        <div className="contas-pagar__grade-wrapper">
          <table className="contas-pagar__grade">
            <thead>
              <tr>
                <th className="contas-pagar__modelo-col">Conta / Contrato</th>
                {grade.meses.map((mes) => (
                  <th
                    key={mes}
                    className={mes === mesAtualIso ? 'contas-pagar__th-current' : ''}
                    style={{ textAlign: 'center' }}
                  >
                    {formatMesLabel(mes)}
                    {mes === mesAtualIso && ' (Atual)'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grade.linhas.map(({ modelo, celulas }) => (
                <tr key={modelo.id}>
                  <td className="contas-pagar__modelo-col">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div>
                        <div className="contas-pagar__modelo-name">
                          {modelo.nome}
                          {modelo.debitoAutomatico && (
                            <span title="Débito automático ativo" style={{ color: '#f59e0b' }}>
                              <Zap size={13} />
                            </span>
                          )}
                        </div>
                        <div className="contas-pagar__modelo-meta">
                          Dia {modelo.diaVencimento} · {modelo.tipo}
                          {modelo.tipo === 'PARCELADO' && modelo.modoParcelamento && modelo.modoParcelamento !== 'FIXO'
                            ? ` · ${formatModoParcelamentoLabel(modelo)}`
                            : ''}
                          {formatIntervaloLabel(modelo.intervaloMeses)
                            ? ` · ${formatIntervaloLabel(modelo.intervaloMeses)}`
                            : ''}
                          {modelo.financiamentoNome ? ` · ${modelo.financiamentoNome}` : modelo.agrupador ? ` · ${modelo.agrupador}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {modelo.tipo === 'PARCELADO' && (
                          <button
                            type="button"
                            className="contas-pagar__icon-btn contas-pagar__icon-btn--purple"
                            onClick={() => setFinanciamentoModeloId(modelo.id)}
                            title="Ver financiamento / Amortizar"
                          >
                            <Building2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="contas-pagar__icon-btn"
                          onClick={() => {
                            setModeloEditar(modelo)
                            setShowModeloModal(true)
                          }}
                          title="Editar modelo"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="contas-pagar__icon-btn contas-pagar__icon-btn--danger"
                          onClick={() => handleExcluirModelo(modelo)}
                          title="Desativar conta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {celulas.map((cel, idx) => {
                    const mesCol = grade.meses[idx]
                    if (!cel) {
                      return (
                        <td key={mesCol} className="contas-pagar__empty-cell">
                          —
                        </td>
                      )
                    }
                    const isEstimado = cel.status === 'AGUARDANDO_VALOR'
                    return (
                      <td key={cel.id}>
                        <div
                          className={`contas-pagar__cell contas-pagar__cell--${cel.statusEfetivo}`}
                          onClick={() => setOcorrenciaAberta(cel)}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {isEstimado ? '~ ' : ''}
                            {formatarMoeda(cel.valorEfetivo)}
                          </div>
                          <div style={{ fontSize: '0.72rem', opacity: 0.9, display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>Venc. {cel.dataVencimento.substring(8, 10)}/{cel.dataVencimento.substring(5, 7)}</span>
                            {cel.numeroParcela && cel.totalParcelas && (
                              <span>
                                {cel.numeroParcela}/{cel.totalParcelas}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="contas-pagar__modelo-col">Total do Mês</td>
                {grade.totaisPorMes.map((t) => (
                  <td key={t.mesReferencia} style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                    <div className="contas-pagar__tfoot-total">Total: {formatarMoeda(t.totalGeral)}</div>
                    <div className="contas-pagar__tfoot-pago">Pago: {formatarMoeda(t.totalPago)}</div>
                    <div className="contas-pagar__tfoot-falta">
                      Falta: {formatarMoeda(t.totalPendente + t.totalEstimado)}
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : aba === 'MES' ? (
        <div className="cp-card-list">
          {ocorrenciasDoMesSelecionado.length === 0 ? (
            <p style={{ opacity: 0.7 }}>Nenhuma ocorrência para este mês.</p>
          ) : (
            ocorrenciasDoMesSelecionado.map((oc) => (
              <div
                key={oc.id}
                className={`cp-card contas-pagar__cell--${oc.statusEfetivo}`}
                onClick={() => setOcorrenciaAberta(oc)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>
                    {oc.modeloNome}
                    {oc.numeroParcela && oc.totalParcelas ? ` (${oc.numeroParcela}/${oc.totalParcelas})` : ''}
                  </strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{oc.statusEfetivo}</span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {oc.status === 'AGUARDANDO_VALOR' ? '~ ' : ''}
                  {formatarMoeda(oc.valorEfetivo)}
                </div>
                <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                  Vencimento: {oc.dataVencimento} · {oc.categoriaNome}
                  {oc.agrupador ? ` · ${oc.agrupador}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="cp-fin-grid">
          {/* Cabeçalho da aba Financiamentos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Meus Financiamentos & Projetos</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', opacity: 0.75 }}>
                Agrupe entrada, mensais, anuais, taxa de obra, prestações e boletos já pagos para ver o Valor Total, Total Pago e Restante.
              </p>
            </div>
            <button
              type="button"
              className="contas-pagar__btn contas-pagar__btn--primary"
              onClick={() => {
                setFinProjetoEditar(null)
                setShowFinProjetoModal(true)
              }}
            >
              <Plus size={16} /> Novo Financiamento / Projeto
            </button>
          </div>

          {financiamentos.length === 0 ? (
            <div className="cp-card" style={{ padding: '28px', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
              <Building2 size={28} style={{ opacity: 0.6 }} />
              <strong>Nenhum financiamento agrupado criado ainda</strong>
              <p style={{ margin: 0, opacity: 0.75, maxWidth: '480px', fontSize: '0.84rem' }}>
                Crie um financiamento (ex.: <strong>Meu Apê MCMV</strong>) para somar valores pagos antes do app, boletos avulsos já pagos e todos os parcelamentos em um único painel.
              </p>
              <button
                type="button"
                className="contas-pagar__btn contas-pagar__btn--primary"
                onClick={() => {
                  setFinProjetoEditar(null)
                  setShowFinProjetoModal(true)
                }}
              >
                <Plus size={16} /> Criar Primeiro Financiamento
              </button>
            </div>
          ) : (
            financiamentos.map((fin) => {
              const cor = fin.corHexadecimal || '#7c5cfc'
              return (
                <div key={fin.id} className="cp-fin-card">
                  <div className="cp-fin-card__accent" style={{ background: cor }} />

                  {/* Cabeçalho do Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.15rem' }}>{fin.nome}</strong>
                        {fin.concluido && (
                          <span className="cp-parcel-badge cp-parcel-badge--down">
                            <CheckCircle2 size={12} /> Concluído / Quitado
                          </span>
                        )}
                      </div>
                      {fin.descricao && (
                        <div style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: '2px' }}>
                          {fin.descricao}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="contas-pagar__btn"
                        style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                        onClick={() => setFinParaVincular(fin)}
                      >
                        <Link2 size={14} /> Vincular Boletos / Transações
                      </button>
                      <button
                        type="button"
                        className="contas-pagar__btn"
                        style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                        onClick={() => {
                          setModeloEditar(null)
                          setModeloFinanciamentoInicialId(fin.id)
                          setModeloTipoInicial('PARCELADO')
                          setShowModeloModal(true)
                        }}
                      >
                        <Plus size={14} /> Novo Contrato
                      </button>
                      <button
                        type="button"
                        className="contas-pagar__icon-btn"
                        onClick={() => {
                          setFinProjetoEditar(fin)
                          setShowFinProjetoModal(true)
                        }}
                        title="Editar financiamento"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="contas-pagar__icon-btn contas-pagar__icon-btn--danger"
                        onClick={() => handleExcluirFinanciamento(fin)}
                        title="Remover financiamento (mantém boletos e transações)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* 3 Grandes KPIs: Valor Total, Total Pago e Valor Restante */}
                  <div className="cp-fin-kpis">
                    <div className="cp-fin-kpi">
                      <span className="cp-fin-kpi__label">
                        {fin.valorContratado != null && fin.valorContratado > 0
                          ? 'Custo Total Projetado'
                          : 'Valor Total'}
                      </span>
                      <span className="cp-fin-kpi__value">{formatarMoeda(fin.valorTotal)}</span>
                    </div>
                    <div className="cp-fin-kpi">
                      <span className="cp-fin-kpi__label">Total Pago</span>
                      <span className="cp-fin-kpi__value cp-fin-kpi__value--paid">
                        {formatarMoeda(fin.totalPago)}
                      </span>
                    </div>
                    <div className="cp-fin-kpi">
                      <span className="cp-fin-kpi__label">Valor Restante</span>
                      <span className="cp-fin-kpi__value cp-fin-kpi__value--rest">
                        {formatarMoeda(fin.totalRestante)}
                      </span>
                    </div>
                  </div>

                  {/* Comparação opcional com o Valor do Bem / Financiado */}
                  {fin.valorContratado != null && fin.valorContratado > 0 && (
                    <div className="cp-parcel-summary" style={{ fontSize: '0.8rem' }}>
                      <span>
                        Valor do Bem / Financiado:{' '}
                        <strong>{formatarMoeda(fin.valorContratado)}</strong>
                      </span>
                      {fin.jurosEncargosProjetados != null && (
                        <span className="cp-parcel-badge cp-parcel-badge--up" style={{ fontSize: '0.76rem' }}>
                          Juros &amp; Encargos Projetados:{' '}
                          {formatarMoeda(fin.jurosEncargosProjetados)}
                          {fin.percentualJurosProjetados != null && fin.percentualJurosProjetados > 0
                            ? ` (+${fin.percentualJurosProjetados.toFixed(1)}%)`
                            : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Barra de progresso + composição */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span>Progresso Financeiro</span>
                      <span>{fin.percentualPago.toFixed(1)}% pago</span>
                    </div>
                    <div
                      style={{
                        height: '10px',
                        borderRadius: '999px',
                        background: 'rgba(128,128,128,0.18)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, fin.percentualPago)}%`,
                          height: '100%',
                          background: fin.concluido ? '#16a34a' : cor,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.74rem' }}>
                      {fin.valorPagoAnteriormente > 0 && (
                        <span className="cp-parcel-badge">
                          Antes do app: {formatarMoeda(fin.valorPagoAnteriormente)}
                        </span>
                      )}
                      {fin.totalPagoModelos > 0 && (
                        <span className="cp-parcel-badge">
                          Boletos pagos: {formatarMoeda(fin.totalPagoModelos)}
                        </span>
                      )}
                      {fin.totalPagoAmortizacoes > 0 && (
                        <span className="cp-parcel-badge">
                          Amortizações: {formatarMoeda(fin.totalPagoAmortizacoes)}
                        </span>
                      )}
                      {fin.totalPagoTransacoesSoltas > 0 && (
                        <span className="cp-parcel-badge">
                          Transações vinculadas: {formatarMoeda(fin.totalPagoTransacoesSoltas)}
                        </span>
                      )}
                      {fin.totalDescontoObtido > 0 && (
                        <span className="cp-parcel-badge cp-parcel-badge--down">
                          Economia em descontos: {formatarMoeda(fin.totalDescontoObtido)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contratos e Boletos vinculados */}
                  {fin.modelos.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.68, marginBottom: '6px' }}>
                        Contratos & Boletos Vinculados ({fin.modelos.length})
                      </div>
                      <div className="cp-fin-sublist">
                        {fin.modelos.map((m) => (
                          <div key={m.id} className="cp-fin-subitem">
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.9rem' }}>{m.nome}</strong>
                                <span className="cp-parcel-badge">{m.tipo}</span>
                                {m.concluido && (
                                  <span className="cp-parcel-badge cp-parcel-badge--down">✓ Concluído</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.76rem', opacity: 0.78, marginTop: '2px' }}>
                                Total: <strong>{formatarMoeda(m.valorTotal)}</strong> · Pago:{' '}
                                <strong style={{ color: '#16a34a' }}>{formatarMoeda(m.totalPago)}</strong> · Resta:{' '}
                                <strong>{formatarMoeda(m.totalRestante)}</strong>
                                {m.totalParcelas ? ` · ${m.parcelasPagas} paga(s) / ${m.parcelasRestantes} aberta(s)` : ''}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {m.tipo === 'PARCELADO' && (
                                <button
                                  type="button"
                                  className="contas-pagar__btn"
                                  style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                                  onClick={() => setFinanciamentoModeloId(m.id)}
                                >
                                  <Building2 size={13} /> Amortizar / Prazo
                                </button>
                              )}
                              <button
                                type="button"
                                className="contas-pagar__icon-btn"
                                title="Desvincular deste financiamento"
                                onClick={() => handleDesvincularModelo(fin.id, m.id, m.nome)}
                              >
                                <Unlink size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transações soltas vinculadas */}
                  {fin.transacoesVinculadas.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.68, marginBottom: '6px' }}>
                        Pagamentos / Transações Avulsas Vinculadas ({fin.transacoesVinculadas.length})
                      </div>
                      <div className="cp-fin-sublist">
                        {fin.transacoesVinculadas.map((t) => (
                          <div key={t.vinculoId} className="cp-fin-subitem">
                            <div>
                              <strong style={{ fontSize: '0.88rem' }}>{t.descricao}</strong>
                              <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                                {t.data} · {t.tipo}
                                {t.categoriaNome ? ` · ${t.categoriaNome}` : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>
                                {formatarMoeda(t.valor)}
                              </strong>
                              <button
                                type="button"
                                className="contas-pagar__icon-btn"
                                title="Desvincular transação"
                                onClick={() => handleDesvincularTransacao(fin.id, t.transacaoId, t.descricao)}
                              >
                                <Unlink size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Parcelamentos ainda não vinculados a um Financiamento pai */}
          {modelosParceladosSoltos.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, opacity: 0.8 }}>
                Parcelamentos Independentes ({modelosParceladosSoltos.length})
              </div>
              <div className="cp-card-list">
                {modelosParceladosSoltos.map((m) => {
                  const intervaloTxt = formatIntervaloLabel(m.intervaloMeses)
                  const temFaixa =
                    (m.modoParcelamento === 'PROGRESSIVO' || m.modoParcelamento === 'PERSONALIZADO') &&
                    m.valorUltimaParcela != null &&
                    m.valorPadrao != null &&
                    m.valorUltimaParcela !== m.valorPadrao
                  return (
                    <div key={m.id} className="cp-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{m.nome}</strong>
                        {m.agrupador && (
                          <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{m.agrupador}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span
                          className={`cp-parcel-badge ${
                            m.modoParcelamento === 'PROGRESSIVO' &&
                            m.valorPadrao != null &&
                            m.valorUltimaParcela != null &&
                            m.valorUltimaParcela < m.valorPadrao
                              ? 'cp-parcel-badge--down'
                              : m.modoParcelamento === 'PROGRESSIVO' &&
                                m.valorPadrao != null &&
                                m.valorUltimaParcela != null &&
                                m.valorUltimaParcela > m.valorPadrao
                              ? 'cp-parcel-badge--up'
                              : ''
                          }`}
                        >
                          {formatModoParcelamentoLabel(m)}
                        </span>
                        {intervaloTxt && <span className="cp-parcel-badge">{intervaloTxt}</span>}
                        {m.valoresEstimados && (
                          <span className="cp-parcel-badge">Estimado (~)</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.84rem', opacity: 0.85 }}>
                        Vence dia {m.diaVencimento} ·{' '}
                        {temFaixa ? (
                          <>
                            Parcelas:{' '}
                            <strong>
                              {formatarMoeda(m.valorPadrao)} → {formatarMoeda(m.valorUltimaParcela)}
                            </strong>
                          </>
                        ) : (
                          <>
                            Parcela estimada: <strong>{formatarMoeda(m.valorPadrao)}</strong>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.75 }}>
                        Prazo total: {m.totalParcelas} parcelas (iniciado no app na parcela{' '}
                        {m.parcelaInicial || 1})
                      </div>
                      <button
                        type="button"
                        className="contas-pagar__btn contas-pagar__btn--primary"
                        onClick={() => setFinanciamentoModeloId(m.id)}
                        style={{ marginTop: '6px', justifyContent: 'center' }}
                      >
                        <Building2 size={15} /> Evolução, Amortização & Prazo
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modais e Drawers */}
      {showModeloModal && (
        <ModeloModal
          modeloEditar={modeloEditar}
          financiamentoInicialId={modeloFinanciamentoInicialId}
          tipoInicial={modeloTipoInicial}
          onClose={() => {
            setShowModeloModal(false)
            setModeloFinanciamentoInicialId(null)
            setModeloTipoInicial(undefined)
          }}
          onSaved={() => {
            setShowModeloModal(false)
            setModeloFinanciamentoInicialId(null)
            setModeloTipoInicial(undefined)
            showToast('Conta salva com sucesso!', 'success')
            carregarDados()
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {showFinProjetoModal && (
        <FinanciamentoProjetoModal
          financiamentoEditar={finProjetoEditar}
          onClose={() => {
            setShowFinProjetoModal(false)
            setFinProjetoEditar(null)
          }}
          onSaved={() => {
            setShowFinProjetoModal(false)
            setFinProjetoEditar(null)
            showToast('Financiamento salvo com sucesso!', 'success')
            carregarDados()
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {finParaVincular && (
        <VincularItensModal
          financiamento={finParaVincular}
          onClose={() => setFinParaVincular(null)}
          onVinculado={() => {
            setFinParaVincular(null)
            showToast('Itens vinculados ao financiamento com sucesso!', 'success')
            carregarDados()
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {ocorrenciaAberta && (
        <OcorrenciaDrawer
          ocorrencia={ocorrenciaAberta}
          onClose={() => setOcorrenciaAberta(null)}
          onUpdated={carregarDados}
          onToast={(msg, type) => showToast(msg, type)}
        />
      )}

      {financiamentoModeloId && (
        <FinanciamentoModal
          modeloId={financiamentoModeloId}
          onClose={() => setFinanciamentoModeloId(null)}
          onUpdated={carregarDados}
          onToast={(msg, type) => showToast(msg, type)}
        />
      )}

      {showNotifModal && (
        <NotificacaoConfigModal
          onClose={() => setShowNotifModal(false)}
          onToast={(msg, type) => showToast(msg, type)}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
