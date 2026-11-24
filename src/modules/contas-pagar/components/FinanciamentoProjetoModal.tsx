import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { FinanciamentoResumo } from '../../../types/contasPagar'
import { contaPagarService } from '../../../services/contaPagarService'

const CORES_PRESET = ['#7c5cfc', '#2563eb', '#16a34a', '#d97706', '#e11d48', '#0891b2', '#9333ea']

interface FinanciamentoProjetoModalProps {
  financiamentoEditar?: FinanciamentoResumo | null
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export function FinanciamentoProjetoModal({
  financiamentoEditar,
  onClose,
  onSaved,
  onError,
}: FinanciamentoProjetoModalProps) {
  const isEdit = !!financiamentoEditar

  const [nome, setNome] = useState(financiamentoEditar?.nome || '')
  const [descricao, setDescricao] = useState(financiamentoEditar?.descricao || '')
  const [corHexadecimal, setCorHexadecimal] = useState(
    financiamentoEditar?.corHexadecimal || '#7c5cfc',
  )
  const [valorPagoAnteriormente, setValorPagoAnteriormente] = useState(
    financiamentoEditar?.valorPagoAnteriormente != null &&
      financiamentoEditar.valorPagoAnteriormente > 0
      ? String(financiamentoEditar.valorPagoAnteriormente)
      : '',
  )
  const [valorContratado, setValorContratado] = useState(
    financiamentoEditar?.valorContratado != null && financiamentoEditar.valorContratado > 0
      ? String(financiamentoEditar.valorContratado)
      : '',
  )
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return onError('Informe o nome do financiamento / projeto.')

    const pagoAnt = valorPagoAnteriormente.trim()
      ? parseFloat(valorPagoAnteriormente.replace(',', '.'))
      : 0
    if (isNaN(pagoAnt) || pagoAnt < 0) {
      return onError('Valor pago anteriormente deve ser zero ou positivo.')
    }

    const contratadoNum = valorContratado.trim()
      ? parseFloat(valorContratado.replace(',', '.'))
      : null
    if (contratadoNum != null && (isNaN(contratadoNum) || contratadoNum < 0)) {
      return onError('Valor do bem / financiado deve ser zero ou positivo.')
    }

    setSubmitting(true)
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        corHexadecimal,
        valorPagoAnteriormente: pagoAnt,
        valorContratado: contratadoNum && contratadoNum > 0 ? contratadoNum : null,
      }
      if (isEdit && financiamentoEditar) {
        await contaPagarService.editarFinanciamento(financiamentoEditar.id, payload)
      } else {
        await contaPagarService.criarFinanciamento(payload)
      }
      onSaved()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro ao salvar financiamento.')
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
      <div className="modal" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={19} />
            {isEdit ? `Editar: ${financiamentoEditar?.nome}` : 'Novo Financiamento / Projeto'}
          </h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="cp-field">
            <label>Nome do Financiamento / Imóvel *</label>
            <input
              type="text"
              placeholder="Ex: Meu Apê MCMV, Carro Novo..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="cp-field">
            <label>Descrição (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Construtora + Taxa de Obra + Financiamento Caixa 420x"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="cp-field">
            <label>Valor do Bem / Financiado — referência (opcional, R$)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder="Ex: 140000,00"
              value={valorContratado}
              onChange={(e) => setValorContratado(e.target.value)}
            />
            <span style={{ fontSize: '0.73rem', opacity: 0.72 }}>
              Usado apenas como referência para comparar com o Custo Total Projetado e mostrar os Juros &amp; Encargos.
            </span>
          </div>

          <div className="cp-field">
            <label>Valor já pago antes do app (R$)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder="0,00"
              value={valorPagoAnteriormente}
              onChange={(e) => setValorPagoAnteriormente(e.target.value)}
            />
            <span style={{ fontSize: '0.73rem', opacity: 0.72 }}>
              Soma direto no Total Pago sem debitar saldo das suas contas bancárias atuais.
            </span>
          </div>

          <div className="cp-field">
            <label>Cor do Card</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CORES_PRESET.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setCorHexadecimal(cor)}
                  title={cor}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: cor,
                    border: corHexadecimal === cor ? '3px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                    transform: corHexadecimal === cor ? 'scale(1.1)' : 'none',
                    transition: 'transform 0.14s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="contas-pagar__btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="contas-pagar__btn contas-pagar__btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Financiamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
