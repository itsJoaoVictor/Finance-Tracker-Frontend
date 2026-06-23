import { useState, useEffect } from 'react'
import { Projecao } from '../../../types'
import { transacaoService } from '../../../services/transacaoService'

interface ProjecaoModalProps {
  onClose: () => void
}

const DIAS_OPTIONS = [30, 60, 90] as const

export function ProjecaoModal({ onClose }: ProjecaoModalProps) {
  const [dias, setDias] = useState<number>(30)
  const [projecoes, setProjecoes] = useState<Projecao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadProjecao() {
    setLoading(true)
    setError('')
    transacaoService
      .projetar(dias)
      .then((res) => setProjecoes(res.data))
      .catch(() => setError('Erro ao carregar projeção.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProjecao()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const ultimoSaldo = projecoes.length > 0 ? projecoes[projecoes.length - 1].saldoProjetado : 0

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 560 }} aria-labelledby="modal-projecao-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-projecao-title">Projeção de Fluxo de Caixa</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {/* Seletor de dias */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DIAS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDias(d)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: `1.5px solid ${dias === d ? 'var(--accent)' : 'rgba(28,26,23,0.15)'}`,
                background: dias === d ? 'var(--accent)' : 'var(--bg)',
                color: dias === d ? '#fff' : 'var(--ink)',
                fontWeight: 600,
                fontSize: '0.85rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {d} dias
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
            Carregando projeção...
          </p>
        )}

        {error && (
          <p style={{ textAlign: 'center', padding: '24px 0', color: '#e03a2a' }}>
            {error}
          </p>
        )}

        {!loading && !error && projecoes.length === 0 && (
          <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
            Nenhum dado de projeção disponível para este período.
          </p>
        )}

        {!loading && !error && projecoes.length > 0 && (
          <>
            <table className="projecao-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th style={{ textAlign: 'right' }}>Saldo Projetado</th>
                </tr>
              </thead>
              <tbody>
                {projecoes.map((p, idx) => (
                  <tr key={idx}>
                    <td>{formatDate(p.data)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(p.saldoProjetado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="projecao-saldo">
              Saldo Projetado Final: {formatCurrency(ultimoSaldo)}
            </div>
          </>
        )}

        {/* Fechar */}
        <div className="modal__actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn-cancel" onClick={onClose} style={{ flex: 1 }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}