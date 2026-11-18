import { useCallback, useEffect, useMemo, useState } from 'react'
import { contaPagarService } from '../../../services/contaPagarService'
import {
  ContaPagarModelo,
  ContaPagarOcorrencia,
  GradeMensalResponse,
} from '../../../types/contasPagar'
import { Toast, useToast } from '../../../components/Toast'
import { ModeloModal } from '../components/ModeloModal'
import { OcorrenciaDrawer } from '../components/OcorrenciaDrawer'
import { FinanciamentoModal } from '../components/FinanciamentoModal'
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

export function ContasPagar() {
  const now = new Date()
  const mesAtualIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [aba, setAba] = useState<'GRADE' | 'MES' | 'FINANCIAMENTOS'>('GRADE')
  const [mesInicioGrade, setMesInicioGrade] = useState(() => addMonths(mesAtualIso, -1))
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualIso)
  const [agrupador, setAgrupador] = useState<string>('TODOS')

  const [grade, setGrade] = useState<GradeMensalResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [showModeloModal, setShowModeloModal] = useState(false)
  const [modeloEditar, setModeloEditar] = useState<ContaPagarModelo | null>(null)
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState<ContaPagarOcorrencia | null>(null)
  const [financiamentoModeloId, setFinanciamentoModeloId] = useState<string | null>(null)
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
      const res = await contaPagarService.obterGrade({
        mesInicio: inicio,
        mesFim: fim,
        agrupador: agrupador === 'TODOS' ? undefined : agrupador,
      })
      setGrade(res.data)
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

  const modelosParcelados = useMemo(() => {
    if (!grade) return []
    return grade.linhas.map((l) => l.modelo).filter((m) => m.tipo === 'PARCELADO')
  }, [grade])

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
            <Building2 size={16} /> Financiamentos ({modelosParcelados.length})
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
              setShowModeloModal(true)
            }}
          >
            <Plus size={16} /> Nova Conta / Financiamento
          </button>
        </div>
      </div>

      {/* Filtro por Agrupador (Imóvel) + Navegação de Período */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="contas-pagar__agrupadores">
          <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 600 }}>Imóvel / Agrupador:</span>
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
      ) : grade.linhas.length === 0 ? (
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
            onClick={() => setShowModeloModal(true)}
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
                    style={{
                      textAlign: 'center',
                      color: mes === mesAtualIso ? 'var(--primary, #2ecc71)' : undefined,
                    }}
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {modelo.nome}
                          {modelo.debitoAutomatico && (
                            <span title="Débito automático ativo" style={{ color: '#f39c12' }}>
                              <Zap size={13} />
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.73rem', opacity: 0.68 }}>
                          Dia {modelo.diaVencimento} · {modelo.tipo}
                          {modelo.agrupador ? ` · ${modelo.agrupador}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {modelo.tipo === 'PARCELADO' && (
                          <button
                            type="button"
                            onClick={() => setFinanciamentoModeloId(modelo.id)}
                            title="Ver financiamento / Amortizar"
                            style={{ background: 'none', border: 'none', color: '#7c5cfc', cursor: 'pointer', padding: '4px' }}
                          >
                            <Building2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setModeloEditar(modelo)
                            setShowModeloModal(true)
                          }}
                          title="Editar modelo"
                          style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.7, cursor: 'pointer', padding: '4px' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirModelo(modelo)}
                          title="Desativar conta"
                          style={{ background: 'none', border: 'none', color: '#e74c3c', opacity: 0.8, cursor: 'pointer', padding: '4px' }}
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
                        <td key={mesCol} style={{ textAlign: 'center', opacity: 0.35 }}>
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
                          <div style={{ fontSize: '0.7rem', opacity: 0.8, display: 'flex', justifyContent: 'space-between' }}>
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
              <tr style={{ background: 'rgba(128,128,128,0.06)', fontWeight: 700 }}>
                <td className="contas-pagar__modelo-col">Total do Mês</td>
                {grade.totaisPorMes.map((t) => (
                  <td key={t.mesReferencia} style={{ fontSize: '0.8rem' }}>
                    <div>Total: {formatarMoeda(t.totalGeral)}</div>
                    <div style={{ color: '#27ae60', fontWeight: 600 }}>Pago: {formatarMoeda(t.totalPago)}</div>
                    <div style={{ color: '#d68910', fontWeight: 600 }}>
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
        <div className="cp-card-list">
          {modelosParcelados.length === 0 ? (
            <div className="cp-card">
              <p style={{ margin: 0, opacity: 0.75 }}>
                Você ainda não cadastrou nenhum financiamento ou conta parcelada via boleto.
              </p>
            </div>
          ) : (
            modelosParcelados.map((m) => (
              <div key={m.id} className="cp-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.05rem' }}>{m.nome}</strong>
                  {m.agrupador && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{m.agrupador}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.84rem', opacity: 0.8 }}>
                  Vence todo dia {m.diaVencimento} · Parcela estimada:{' '}
                  <strong>{formatarMoeda(m.valorPadrao)}</strong>
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
                  <Building2 size={15} /> Abrir Evolução & Amortização (FGTS)
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modais e Drawers */}
      {showModeloModal && (
        <ModeloModal
          modeloEditar={modeloEditar}
          onClose={() => setShowModeloModal(false)}
          onSaved={() => {
            setShowModeloModal(false)
            showToast('Conta salva com sucesso!', 'success')
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
