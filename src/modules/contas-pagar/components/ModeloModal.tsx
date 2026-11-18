import { useEffect, useState } from 'react'
import { ContaPagarModelo, TipoContaPagar } from '../../../types/contasPagar'
import { categoryService } from '../../../services/categoryService'
import { contaService } from '../../../services/contaService'
import { contaPagarService } from '../../../services/contaPagarService'

interface ModeloModalProps {
  modeloEditar?: ContaPagarModelo | null
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export function ModeloModal({ modeloEditar, onClose, onSaved, onError }: ModeloModalProps) {
  const isEdit = !!modeloEditar
  const hoje = new Date().toISOString().split('T')[0]

  const [nome, setNome] = useState(modeloEditar?.nome || '')
  const [tipo, setTipo] = useState<TipoContaPagar>(modeloEditar?.tipo || 'VARIAVEL')
  const [categoriaId, setCategoriaId] = useState(modeloEditar?.categoriaId || '')
  const [agrupador, setAgrupador] = useState(modeloEditar?.agrupador || '')
  const [diaVencimento, setDiaVencimento] = useState(String(modeloEditar?.diaVencimento || 10))
  const [valorPadrao, setValorPadrao] = useState(
    modeloEditar?.valorPadrao != null ? String(modeloEditar.valorPadrao) : '',
  )
  const [totalParcelas, setTotalParcelas] = useState(
    modeloEditar?.totalParcelas != null ? String(modeloEditar.totalParcelas) : '360',
  )
  const [parcelaInicial, setParcelaInicial] = useState(
    modeloEditar?.parcelaInicial != null ? String(modeloEditar.parcelaInicial) : '1',
  )
  const [dataInicio, setDataInicio] = useState(modeloEditar?.dataInicio || hoje)
  const [dataFim, setDataFim] = useState(modeloEditar?.dataFim || '')
  const [debitoAutomatico, setDebitoAutomatico] = useState(
    Boolean(modeloEditar?.debitoAutomatico),
  )
  const [contaPadraoId, setContaPadraoId] = useState(modeloEditar?.contaPadraoId || '')
  const [aplicarFuturas, setAplicarFuturas] = useState(true)

  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setCategorias(list)
      if (!categoriaId && list.length > 0) setCategoriaId(list[0].id)
    })
    contaService.getAll().then((res) => {
      const list = Array.isArray(res) ? res : (res as any).data || []
      setContas(list)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return onError('Informe o nome da conta.')
    if (!categoriaId) return onError('Selecione uma categoria.')
    const dia = parseInt(diaVencimento, 10)
    if (isNaN(dia) || dia < 1 || dia > 31) return onError('Dia de vencimento deve ser entre 1 e 31.')

    const valNum = valorPadrao ? parseFloat(valorPadrao.replace(',', '.')) : null
    if ((tipo === 'FIXO' || tipo === 'PARCELADO') && (!valNum || valNum <= 0)) {
      return onError('Informe o valor padrão/parcela estimada.')
    }
    if (debitoAutomatico && !contaPadraoId) {
      return onError('Selecione a conta padrão para o débito automático.')
    }

    setSubmitting(true)
    try {
      if (isEdit && modeloEditar) {
        await contaPagarService.editarModelo(modeloEditar.id, {
          nome: nome.trim(),
          categoriaId,
          agrupador: agrupador.trim() || null,
          diaVencimento: dia,
          valorPadrao: valNum,
          dataFim: dataFim || null,
          debitoAutomatico,
          contaPadraoId: contaPadraoId || null,
          aplicarValorOcorrenciasFuturas: aplicarFuturas,
        })
      } else {
        await contaPagarService.criarModelo({
          nome: nome.trim(),
          tipo,
          categoriaId,
          agrupador: agrupador.trim() || null,
          diaVencimento: dia,
          valorPadrao: valNum,
          totalParcelas: tipo === 'PARCELADO' ? parseInt(totalParcelas, 10) : null,
          parcelaInicial: tipo === 'PARCELADO' ? parseInt(parcelaInicial || '1', 10) : null,
          dataInicio,
          dataFim: tipo !== 'PARCELADO' && dataFim ? dataFim : null,
          debitoAutomatico,
          contaPadraoId: contaPadraoId || null,
        })
      }
      onSaved()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao salvar modelo de conta.')
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
      <div className="modal" style={{ maxWidth: '540px', width: '100%' }}>
        <div className="modal__header">
          <h2 className="modal__title">
            {isEdit ? `Editar: ${modeloEditar?.nome}` : 'Nova Conta a Pagar / Financiamento'}
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isEdit && (
            <div className="cp-field">
              <label>Tipo de Conta</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(
                  [
                    { id: 'VARIAVEL', title: 'Variável', sub: 'Água, Luz, Gás' },
                    { id: 'FIXO', title: 'Fixa', sub: 'Condomínio, Internet' },
                    { id: 'PARCELADO', title: 'Parcelada / Imóvel', sub: 'Financiamento, IPTU' },
                  ] as const
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setTipo(op.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: `2px solid ${tipo === op.id ? 'var(--primary, #2f5b4b)' : 'var(--border, rgba(128,128,128,0.25))'}`,
                      background: tipo === op.id ? 'rgba(47, 91, 75, 0.14)' : 'transparent',
                      color: 'inherit',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{op.title}</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{op.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="cp-field">
              <label>Nome da Conta *</label>
              <input
                type="text"
                placeholder={
                  tipo === 'VARIAVEL'
                    ? 'Ex: Conta de Luz - Enel'
                    : tipo === 'PARCELADO'
                    ? 'Ex: Financiamento Imóvel Caixa'
                    : 'Ex: Condomínio'
                }
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="cp-field">
              <label>Agrupador / Imóvel (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Apto Novo, Casa Atual"
                value={agrupador}
                onChange={(e) => setAgrupador(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="cp-field">
              <label>Categoria *</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label>Dia de Vencimento (1–31) *</label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                required
              />
            </div>

            <div className="cp-field">
              <label>
                {tipo === 'VARIAVEL'
                  ? 'Estimativa inicial (R$)'
                  : tipo === 'PARCELADO'
                  ? 'Parcela estimada atual (R$) *'
                  : 'Valor mensal (R$) *'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorPadrao}
                onChange={(e) => setValorPadrao(e.target.value)}
              />
            </div>
          </div>

          {!isEdit && tipo === 'PARCELADO' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(124, 92, 252, 0.08)',
              }}
            >
              <div className="cp-field">
                <label>Total de Parcelas *</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  required
                />
              </div>
              <div className="cp-field">
                <label>Começar na Parcela nº *</label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={parcelaInicial}
                  onChange={(e) => setParcelaInicial(e.target.value)}
                  required
                />
              </div>
              <div className="cp-field">
                <label>Mês desta Parcela *</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {tipo !== 'PARCELADO' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {!isEdit && (
                <div className="cp-field">
                  <label>Mês de Início *</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="cp-field">
                <label>Data de Encerramento (opcional)</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border, rgba(128,128,128,0.2))',
            }}
          >
            <div className="cp-field">
              <label>Conta Bancária Padrão</label>
              <select value={contaPadraoId} onChange={(e) => setContaPadraoId(e.target.value)}>
                <option value="">Nenhuma (escolher ao pagar)</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                marginTop: '16px',
              }}
            >
              <input
                type="checkbox"
                checked={debitoAutomatico}
                onChange={(e) => setDebitoAutomatico(e.target.checked)}
              />
              <span>
                <strong>Débito Automático</strong>
                <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                  Paga no vencimento se o valor real estiver confirmado
                </div>
              </span>
            </label>
          </div>

          {isEdit && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
              <input
                type="checkbox"
                checked={aplicarFuturas}
                onChange={(e) => setAplicarFuturas(e.target.checked)}
              />
              Aplicar novo valor padrão às ocorrências futuras ainda pendentes
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="contas-pagar__btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="contas-pagar__btn contas-pagar__btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
