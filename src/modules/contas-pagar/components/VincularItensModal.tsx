import { useEffect, useMemo, useState } from 'react'
import { Link2, Search, FileText, ArrowLeftRight } from 'lucide-react'
import { FinanciamentoResumo, ItensDisponiveisVinculo } from '../../../types/contasPagar'
import { contaPagarService } from '../../../services/contaPagarService'

interface VincularItensModalProps {
  financiamento: FinanciamentoResumo
  onClose: () => void
  onVinculado: () => void
  onError: (msg: string) => void
}

export function VincularItensModal({
  financiamento,
  onClose,
  onVinculado,
  onError,
}: VincularItensModalProps) {
  const [aba, setAba] = useState<'MODELOS' | 'TRANSACOES'>('MODELOS')
  const [dados, setDados] = useState<ItensDisponiveisVinculo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modeloIds, setModeloIds] = useState<string[]>([])
  const [transacaoIds, setTransacaoIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    contaPagarService
      .listarItensDisponiveisVinculo()
      .then((res) => setDados(res.data))
      .catch(() => onError('Erro ao carregar boletos e transações disponíveis.'))
      .finally(() => setLoading(false))
  }, [])

  const formatar = (v?: number | null) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const toggleModelo = (id: string) => {
    setModeloIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleTransacao = (id: string) => {
    setTransacaoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const modelosFiltrados = useMemo(() => {
    if (!dados) return []
    const q = busca.trim().toLowerCase()
    if (!q) return dados.modelosDisponiveis
    return dados.modelosDisponiveis.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        (m.agrupador || '').toLowerCase().includes(q) ||
        m.tipo.toLowerCase().includes(q),
    )
  }, [dados, busca])

  const transacoesFiltradas = useMemo(() => {
    if (!dados) return []
    const q = busca.trim().toLowerCase()
    if (!q) return dados.transacoesDisponiveis
    return dados.transacoesDisponiveis.filter(
      (t) =>
        t.descricao.toLowerCase().includes(q) ||
        (t.categoriaNome || '').toLowerCase().includes(q) ||
        t.data.includes(q),
    )
  }, [dados, busca])

  const resumoSelecao = useMemo(() => {
    if (!dados) return { qtd: 0, pago: 0, restante: 0 }
    let pago = 0
    let restante = 0
    for (const id of modeloIds) {
      const m = dados.modelosDisponiveis.find((x) => x.id === id)
      if (m) {
        pago += m.totalPago || 0
        restante += m.totalRestante || 0
      }
    }
    for (const id of transacaoIds) {
      const t = dados.transacoesDisponiveis.find((x) => x.id === id)
      if (t) pago += t.valor || 0
    }
    return { qtd: modeloIds.length + transacaoIds.length, pago, restante }
  }, [dados, modeloIds, transacaoIds])

  const handleConfirmar = async () => {
    if (resumoSelecao.qtd === 0) {
      return onError('Selecione ao menos um boleto, contrato ou transação para vincular.')
    }
    setSubmitting(true)
    try {
      await contaPagarService.vincularItensFinanciamento(financiamento.id, {
        modeloIds,
        transacaoIds,
      })
      onVinculado()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao vincular itens ao financiamento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={19} /> Vincular a: {financiamento.nome}
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.78 }}>
          Associe boletos individuais já pagos, parcelamentos existentes ou transações soltas a este financiamento — <strong>sem debitar novamente suas contas</strong>.
        </p>

        {/* Abas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="contas-pagar__tabs">
            <button
              type="button"
              className={`contas-pagar__tab ${aba === 'MODELOS' ? 'contas-pagar__tab--active' : ''}`}
              onClick={() => setAba('MODELOS')}
            >
              <FileText size={14} /> Boletos & Contratos ({dados?.modelosDisponiveis.length ?? 0})
            </button>
            <button
              type="button"
              className={`contas-pagar__tab ${aba === 'TRANSACOES' ? 'contas-pagar__tab--active' : ''}`}
              onClick={() => setAba('TRANSACOES')}
            >
              <ArrowLeftRight size={14} /> Transações Soltas ({dados?.transacoesDisponiveis.length ?? 0})
            </button>
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.55 }}
            />
            <input
              type="text"
              placeholder="Buscar por nome, categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 30px',
                borderRadius: '10px',
                border: '1.5px solid var(--field-border, rgba(15, 23, 42, 0.18))',
                background: 'var(--field-bg, #ffffff)',
                color: 'var(--ink)',
                fontSize: '0.84rem',
              }}
            />
          </div>
        </div>

        {/* Lista */}
        <div style={{ overflowY: 'auto', maxHeight: '340px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {loading || !dados ? (
            <div style={{ padding: '28px', textAlign: 'center', opacity: 0.7 }}>
              Carregando itens disponíveis...
            </div>
          ) : aba === 'MODELOS' ? (
            modelosFiltrados.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', opacity: 0.7, fontSize: '0.84rem' }}>
                Nenhum boleto ou contrato sem financiamento encontrado.
              </div>
            ) : (
              modelosFiltrados.map((m) => {
                const checked = modeloIds.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={`cp-vinculo-item ${checked ? 'cp-vinculo-item--checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModelo(m.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{m.nome}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.72 }}>
                        {m.tipo}
                        {m.agrupador ? ` · ${m.agrupador}` : ''}
                        {' · '}
                        {m.parcelasPagas} paga(s) / {m.parcelasRestantes} restante(s)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {m.totalPago > 0 && (
                        <div style={{ color: '#16a34a', fontWeight: 700 }}>
                          Pago: {formatar(m.totalPago)}
                        </div>
                      )}
                      {m.totalRestante > 0 && (
                        <div style={{ opacity: 0.8 }}>Resta: {formatar(m.totalRestante)}</div>
                      )}
                    </div>
                  </label>
                )
              })
            )
          ) : transacoesFiltradas.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', opacity: 0.7, fontSize: '0.84rem' }}>
              Nenhuma transação solta disponível (transações que já pertencem a um boleto aparecem na aba "Boletos & Contratos").
            </div>
          ) : (
            transacoesFiltradas.map((t) => {
              const checked = transacaoIds.includes(t.id)
              return (
                <label
                  key={t.id}
                  className={`cp-vinculo-item ${checked ? 'cp-vinculo-item--checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTransacao(t.id)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.descricao}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.72 }}>
                      {t.data} · {t.tipo}
                      {t.categoriaNome ? ` · ${t.categoriaNome}` : ''}
                    </div>
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: '#16a34a', whiteSpace: 'nowrap' }}>
                    {formatar(t.valor)}
                  </strong>
                </label>
              )
            })
          )}
        </div>

        {/* Rodapé */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle, rgba(15, 23, 42, 0.1))',
          }}
        >
          <div style={{ fontSize: '0.8rem' }}>
            {resumoSelecao.qtd > 0 ? (
              <>
                <strong>{resumoSelecao.qtd}</strong> selecionado(s)
                {resumoSelecao.pago > 0 && ` · +${formatar(resumoSelecao.pago)} pago`}
                {resumoSelecao.restante > 0 && ` · +${formatar(resumoSelecao.restante)} restante`}
              </>
            ) : (
              <span style={{ opacity: 0.7 }}>Selecione os itens que pertencem a este financiamento</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="contas-pagar__btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="contas-pagar__btn contas-pagar__btn--primary"
              onClick={handleConfirmar}
              disabled={submitting || resumoSelecao.qtd === 0}
            >
              {submitting ? 'Vinculando...' : `Vincular (${resumoSelecao.qtd})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
