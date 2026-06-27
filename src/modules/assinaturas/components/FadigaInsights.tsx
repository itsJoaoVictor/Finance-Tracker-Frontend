import { useState, useEffect } from 'react'
import { iaService, FadigaAssinaturaResponse, PendenteConfirmacao } from '../../../services/iaService'

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_CONFIG = {
  SAUDAVEL: {
    accent: 'var(--accent-2)',
    gradient: 'linear-gradient(135deg, rgba(47, 91, 75, 0.06) 0%, rgba(47, 91, 75, 0.02) 100%)',
    barBg: 'rgba(47, 91, 75, 0.12)',
    badge: 'Saudável',
    pulse: false,
  },
  ATENCAO: {
    accent: 'var(--primary)',
    gradient: 'linear-gradient(135deg, rgba(200, 150, 12, 0.06) 0%, rgba(200, 150, 12, 0.02) 100%)',
    barBg: 'rgba(200, 150, 12, 0.12)',
    badge: 'Atenção',
    pulse: true,
  },
  FADIGA: {
    accent: 'var(--accent)',
    gradient: 'linear-gradient(135deg, rgba(240, 90, 60, 0.08) 0%, rgba(240, 90, 60, 0.02) 100%)',
    barBg: 'rgba(240, 90, 60, 0.12)',
    badge: 'Fadiga',
    pulse: true,
  },
  SEM_DADOS: {
    accent: 'var(--muted)',
    gradient: 'linear-gradient(135deg, rgba(107, 95, 85, 0.04) 0%, rgba(107, 95, 85, 0.01) 100%)',
    barBg: 'rgba(107, 95, 85, 0.08)',
    badge: 'Sem dados',
    pulse: false,
  },
}

const PERFIS_USO = [
  { valor: 'uso_diario',    label: 'Diário',     desc: 'Não consigo viver sem' },
  { valor: 'uso_regulares', label: 'Regular',    desc: 'Uso bastante, mas repensaria' },
  { valor: 'pouco_uso',     label: 'Pouco',      desc: 'Raramente abro' },
  { valor: 'esqueci',       label: 'Nem lembro', desc: 'Já nem sei que tenho isso' },
]

export function FadigaInsights() {
  const [data, setData] = useState<FadigaAssinaturaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendentes, setPendentes] = useState<PendenteConfirmacao[]>([])
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [respondido, setRespondido] = useState<Set<string>>(new Set())
  const [montado, setMontado] = useState(false)

  const recarregar = () => {
    iaService.getFadigaAssinatura()
      .then(res => setData(res.data))
      .catch(() => {})
  }

  useEffect(() => {
    recarregar()
    setLoading(false)
    iaService.getPendentesConfirmacao()
      .then(res => setPendentes(res.data))
      .catch(() => {})
    // Trigger entrance animation after mount
    requestAnimationFrame(() => requestAnimationFrame(() => setMontado(true)))
  }, [])

  async function handleClassificar(assinaturaId: string, perfil: string) {
    setRespondendo(assinaturaId)
    try {
      await iaService.classificarComportamento(assinaturaId, perfil)
      setRespondido(prev => new Set(prev).add(assinaturaId))
      setPendentes(prev => prev.filter(p => p.assinaturaId !== assinaturaId))
      recarregar()
    } catch {
      // Silently fail
    } finally {
      setRespondendo(null)
    }
  }

  // ── Skeleton ──
  if (loading) {
    return (
      <div className="fadiga fadiga--skeleton">
        <div className="fadiga__glow fadiga__glow--loading" />
        <div className="fadiga__inner">
          <div className="skeleton-line" style={{ width: 90, height: 22 }} />
          <div className="skeleton-line" style={{ width: 180, height: 14, marginTop: 16 }} />
          <div className="skeleton-line skeleton-bar" style={{ marginTop: 20 }} />
        </div>
      </div>
    )
  }

  if (!data || data.totalAssinaturas === 0) return null

  const config = STATUS_CONFIG[data.classificacaoGlobal as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.SEM_DADOS

  // Percentuais
  const total = Number(data.totalGeral) || 0
  const pctE = total > 0 ? (Number(data.totalEssenciais) / total) * 100 : 0
  const pctI = total > 0 ? (Number(data.totalImportantes) / total) * 100 : 0
  const pctO = total > 0 ? 100 - pctE - pctI : 0

  return (
    <div className={`fadiga ${montado ? 'fadiga--montado' : ''}`}>
      {/* Background glow */}
      <div className="fadiga__glow" style={{ background: config.gradient }} />

      <div className="fadiga__inner">
        {/* ── ROW 1: Status + Valor total ── */}
        <div className="fadiga__row-hero">
          <div className="fadiga__status">
            <span
              className={`fadiga__status-dot ${config.pulse ? 'fadiga__status-dot--pulse' : ''}`}
              style={{ background: config.accent }}
            />
            <span className="fadiga__status-label" style={{ color: config.accent }}>
              {config.badge}
            </span>
          </div>

          <div className="fadiga__valor-group">
            <span className="fadiga__valor">{formatCurrency(data.totalGeral)}</span>
            <span className="fadiga__periodo">/mês</span>
          </div>
        </div>

        {/* ── ROW 2: Título + contagem ── */}
        <div className="fadiga__row-titulo">
          <h3 className="fadiga__titulo">Fadiga de Assinaturas</h3>
          <span className="fadiga__contagem">
            {data.totalAssinaturas} assinatura{data.totalAssinaturas !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── ROW 3: Barra visual + fatura % ── */}
        <div className="fadiga__barra-wrap">
          <div className="fadiga__barra" style={{ background: config.barBg }}>
            {pctE > 0 && (
              <div
                className="fadiga__barra-seg fadiga__barra-seg--essencial"
                style={{ width: montado ? `${pctE}%` : '0%' }}
                title={`Essenciais: ${formatCurrency(data.totalEssenciais)}`}
              />
            )}
            {pctI > 0 && (
              <div
                className="fadiga__barra-seg fadiga__barra-seg--importante"
                style={{ width: montado ? `${pctI}%` : '0%' }}
                title={`Importantes: ${formatCurrency(data.totalImportantes)}`}
              />
            )}
            {pctO > 0 && (
              <div
                className="fadiga__barra-seg fadiga__barra-seg--opcional"
                style={{ width: montado ? `${pctO}%` : '0%' }}
                title={`Opcionais: ${formatCurrency(data.totalDiscricionarias)}`}
              />
            )}
          </div>

          <div className="fadiga__fatura-pct">
            <span className="fadiga__fatura-pct-num" style={{ color: config.accent }}>
              {data.indiceAssinaturas.toFixed(0)}%
            </span>
            <span className="fadiga__fatura-pct-label">da fatura</span>
          </div>
        </div>

        {/* ── ROW 4: Legend ── */}
        <div className="fadiga__legend">
          {pctE > 0 && (
            <div className="fadiga__legend-item">
              <span className="fadiga__legend-dot" style={{ background: 'var(--accent-2)' }} />
              <span className="fadiga__legend-text">Essenciais</span>
              <span className="fadiga__legend-val">{formatCurrency(data.totalEssenciais)}</span>
            </div>
          )}
          {pctI > 0 && (
            <div className="fadiga__legend-item">
              <span className="fadiga__legend-dot" style={{ background: '#b8860b' }} />
              <span className="fadiga__legend-text">Importantes</span>
              <span className="fadiga__legend-val">{formatCurrency(data.totalImportantes)}</span>
            </div>
          )}
          {pctO > 0 && (
            <div className="fadiga__legend-item">
              <span className="fadiga__legend-dot" style={{ background: 'var(--accent)' }} />
              <span className="fadiga__legend-text">Opcionais</span>
              <span className="fadiga__legend-val">{formatCurrency(data.totalDiscricionarias)}</span>
            </div>
          )}
        </div>

        {/* ── ROW 5: Perguntas comportamentais ── */}
        {pendentes.length > 0 && (
          <div className="fadiga__perguntas">
            <div className="fadiga__perguntas-header">
              <div className="fadiga__perguntas-robot"><span>AI</span></div>
              <p className="fadiga__perguntas-titulo">
                Preciso da sua ajuda em {pendentes.length} assinatura{pendentes.length > 1 ? 's' : ''}
              </p>
            </div>
            {pendentes.map(p => (
              <div key={p.assinaturaId} className="fadiga__pergunta">
                <div className="fadiga__pergunta-info">
                  <span className="fadiga__pergunta-nome">{p.nome}</span>
                  <span className="fadiga__pergunta-detalhe">{p.categoria} · {formatCurrency(p.valorMensal)}/mês</span>
                </div>
                <div className="fadiga__pergunta-botoes">
                  {PERFIS_USO.map(perfil => (
                    <button
                      key={perfil.valor}
                      className={`fadiga__pergunta-btn ${respondido.has(p.assinaturaId) ? 'fadiga__pergunta-btn--done' : ''}`}
                      disabled={respondendo === p.assinaturaId || respondido.has(p.assinaturaId)}
                      title={perfil.desc}
                      onClick={() => handleClassificar(p.assinaturaId, perfil.valor)}
                    >
                      {respondendo === p.assinaturaId ? '...' : perfil.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ROW 6: Alertas ── */}
        {(Object.keys(data.duplicadasPorCategoria).length > 0 || data.servicosSemelhantes.length > 0) && (
          <div className="fadiga__alertas">
            {Object.entries(data.duplicadasPorCategoria).map(([cat, qtd]) => (
              <div key={cat} className="fadiga__alerta">
                <span className="fadiga__alerta-dot" />
                <span>{qtd} serviços na categoria <strong>{cat}</strong></span>
              </div>
            ))}
            {data.servicosSemelhantes.map((s, i) => (
              <div key={i} className="fadiga__alerta">
                <span className="fadiga__alerta-dot" />
                <span>Serviços semelhantes: {s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
