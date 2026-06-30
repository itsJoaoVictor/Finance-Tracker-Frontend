import { useState, useEffect } from 'react'
import { iaService, DominioEfeitoDominoResponse, AlertaCartao, ItemRanking } from '../../../services/iaService'

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
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

const NIVEL_CONFIG: Record<string, { accent: string; gradient: string; emoji: string; label: string }> = {
  ALTO: {
    accent: 'var(--accent)',
    gradient: 'linear-gradient(135deg, rgba(240, 90, 60, 0.08) 0%, rgba(240, 90, 60, 0.02) 100%)',
    emoji: '🔴',
    label: 'Risco Alto',
  },
  MEDIO: {
    accent: 'var(--primary)',
    gradient: 'linear-gradient(135deg, rgba(200, 150, 12, 0.06) 0%, rgba(200, 150, 12, 0.02) 100%)',
    emoji: '🟡',
    label: 'Risco Médio',
  },
  BAIXO: {
    accent: 'var(--accent-2)',
    gradient: 'linear-gradient(135deg, rgba(47, 91, 75, 0.06) 0%, rgba(47, 91, 75, 0.02) 100%)',
    emoji: '🟢',
    label: 'Risco Baixo',
  },
}

const ESSENCIALIDADE_EMOJI: Record<string, string> = {
  ESSENCIAL: '🟢',
  IMPORTANTE: '🟡',
  OPCIONAL: '🔴',
  DISCRICIONARIA: '🔴',
}

function AlertaCard({ alerta }: { alerta: AlertaCartao }) {
  const [expandido, setExpandido] = useState(false)
  const config = NIVEL_CONFIG[alerta.nivelAlerta] || NIVEL_CONFIG.BAIXO

  return (
    <div
      style={{
        background: config.gradient,
        border: `1px solid ${config.accent}`,
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>{config.emoji}</span>
          <span style={{ fontWeight: 600, color: config.accent }}>{config.label} — Cartão {alerta.cartaoNome}</span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {alerta.diasRestantes === 1 ? 'amanhã' : `em ${alerta.diasRestantes} dias`}
        </span>
      </div>

      {/* Resumo */}
      <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        {formatCurrency(alerta.totalCobranca)} em cobranças nos próximos {alerta.diasRestantes} dias.
        Limite disponível: {formatCurrency(alerta.limiteDisponivel)}.
      </p>

      {/* Toggle ranking */}
      <button
        onClick={() => setExpandido(!expandido)}
        style={{
          background: 'none', border: 'none', color: config.accent,
          cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0',
          textDecoration: 'underline',
        }}
      >
        {expandido ? 'Ocultar detalhes' : `Ver ${alerta.ranking.length} assinaturas`}
      </button>

      {/* Ranking expandido */}
      {expandido && (
        <div style={{
          marginTop: 8, background: 'rgba(0,0,0,0.03)',
          borderRadius: 8, padding: '8px 12px',
        }}>
          {alerta.ranking.map((r: ItemRanking) => (
            <div
              key={r.assinaturaId}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', fontSize: '0.85rem',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{ESSENCIALIDADE_EMOJI[r.essencialidade] || '⚪'}</span>
                <span>{r.nome}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{formatDate(r.dataCobranca)}</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(r.valor)}</span>
                <span>{r.falha ? '❌' : '✅'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recomendações */}
      {alerta.recomendacoes.length > 0 && (
        <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ marginRight: 4 }}>💡</span>
          {alerta.recomendacoes[0]}
        </div>
      )}
    </div>
  )
}

export function AlertaCritico() {
  const [data, setData] = useState<DominioEfeitoDominoResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    iaService.getEfeitoDominio()
      .then(res => {
        if (res.data.alertas.length > 0) {
          setData(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data || data.alertas.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontSize: '0.9rem', fontWeight: 600,
        color: 'var(--accent)', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ⚠️ Prioridade Máxima
      </h3>
      {data.alertas.map((alerta: AlertaCartao) => (
        <AlertaCard key={alerta.cartaoId} alerta={alerta} />
      ))}
    </div>
  )
}
