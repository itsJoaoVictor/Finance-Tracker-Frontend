import { useState, useRef, useEffect, useCallback } from 'react'
import { Assinatura } from '../../../types'
import { ReajusteDetectado } from '../../../services/iaService'
import { FinanceCard } from '../../../components/FinanceCard'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AuditoriaInfo {
  mesesAtivos: number
  custoAcumulado: number
  essencialidade: string
}

interface SubscriptionCardProps {
  assinatura: Assinatura
  categoriaNome: string
  categoriaCor?: string
  categoriaIcone?: string
  cartaoNome: string
  periodicidadeLabel: string
  reajuste?: ReajusteDetectado
  auditoriaAtiva?: boolean
  auditoriaInfo?: AuditoriaInfo
  onEdit: (assinatura: Assinatura) => void
  onPauseResume: (assinatura: Assinatura) => void
  onDelete: (assinatura: Assinatura) => void
  onAuditoriaFeedback?: (assinaturaId: string, opcao: 'manter' | 'nao_utilizo') => void
}

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

export function SubscriptionCard({
  assinatura,
  categoriaNome,
  categoriaCor,
  categoriaIcone,
  cartaoNome,
  periodicidadeLabel,
  reajuste,
  auditoriaAtiva,
  onEdit,
  onPauseResume,
  onDelete,
  onAuditoriaFeedback,
  auditoriaInfo,
}: SubscriptionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [auditoriaExpandida, setAuditoriaExpandida] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const badgeText = assinatura.ativo ? 'Ativa' : 'Pausada'

  const cleanName = assinatura.nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)[0]

  const logoUrl = `https://icons.duckduckgo.com/ip3/www.${cleanName}.com.ico`
  const cardColor = categoriaCor || '#ccc'

  const iconNode = (
    <img
      src={logoUrl}
      alt={assinatura.nome}
      style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }}
      onError={(e) => {
        ;(e.target as HTMLElement).style.display = 'none'
        const parent = (e.target as HTMLElement).parentElement
        if (parent) {
          parent.innerText = categoriaIcone || '🔄'
        }
      }}
    />
  )

  const isAumento = reajuste ? reajuste.valorAtual > reajuste.valorAnterior : false

  const showTooltip = useCallback(() => {
    if (!badgeRef.current || !wrapperRef.current) return
    const badgeRect = badgeRef.current.getBoundingClientRect()
    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    setTooltipPos({
      x: badgeRect.left - wrapperRect.left,
      y: badgeRect.top - wrapperRect.top - 8,
    })
    setTooltipOpen(true)
  }, [])

  // Badge inline com o valor
  const reajusteBadge = reajuste ? (
    <div
      ref={badgeRef}
      className="assinatura-card__reajuste"
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipOpen(false)}
      onClick={() => setTooltipOpen(t => !t)}
    >
      {isAumento ? (
        <TrendingUp size={11} strokeWidth={2.5} />
      ) : (
        <TrendingDown size={11} strokeWidth={2.5} />
      )}
      <span className="assinatura-card__reajuste-pct">
        {isAumento ? '+' : ''}{reajuste.percentualAumento.toFixed(1)}%
      </span>
    </div>
  ) : null

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div
        className={auditoriaAtiva ? 'assinatura-card--zumbi' : ''}
        style={auditoriaAtiva ? {
          border: '2px dashed rgba(200, 150, 12, 0.5)',
          borderRadius: 16,
          background: 'rgba(200, 150, 12, 0.03)',
          position: 'relative',
        } : undefined}
      >
        {auditoriaAtiva && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            fontSize: '0.7rem', fontWeight: 600,
            color: 'var(--primary)', background: 'rgba(200, 150, 12, 0.12)',
            padding: '2px 8px', borderRadius: 6, zIndex: 5,
          }}>
            👻 Zumbi
          </span>
        )}
        <FinanceCard
          titulo={assinatura.nome}
          subtitulo={`${categoriaNome} \u2022 ${periodicidadeLabel}`}
          valorPrincipal={formatCurrency(assinatura.valor)}
          corHexadecimal={cardColor}
          icone={iconNode}
          badgeText={badgeText}
          valorExtra={reajusteBadge}
          onClickOptions={() => setMenuOpen((o) => !o)}
        >
          <p className="assinatura-card__proxima">
            Pr&oacute;xima cobran&ccedil;a: {formatDate(assinatura.dataProximaCobranca)}
          </p>
          <p className="assinatura-card__cartao">
            Cart&atilde;o: {cartaoNome}
          </p>
          {auditoriaAtiva && (
            <button
              onClick={(e) => { e.stopPropagation(); setAuditoriaExpandida(v => !v) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(200, 150, 12, 0.08)',
                border: '1px solid rgba(200, 150, 12, 0.25)',
                borderRadius: 8, padding: '5px 12px', marginTop: 6,
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
                color: 'var(--primary)', width: 'fit-content',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(200, 150, 12, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(200, 150, 12, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(200, 150, 12, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(200, 150, 12, 0.25)'
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>👻</span>
              {auditoriaExpandida ? 'Ocultar detalhes' : 'Revisar uso'}
              <span style={{
                display: 'inline-block', fontSize: '0.65rem',
                transform: auditoriaExpandida ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s ease',
              }}>▾</span>
            </button>
          )}
        </FinanceCard>

        {/* Painel expandido de auditoria zumbi */}
        {auditoriaAtiva && auditoriaExpandida && (
          <div
            style={{
              margin: '0 12px 12px', padding: '12px 14px',
              background: 'rgba(200, 150, 12, 0.04)',
              border: '1px solid rgba(200, 150, 12, 0.15)',
              borderRadius: 10, fontSize: '0.82rem',
              color: 'var(--text-secondary)', lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: '0.9rem' }}>👻</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Auditoria de Assinatura</span>
            </div>
            {auditoriaInfo ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Meses ativos</span>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{auditoriaInfo.mesesAtivos} meses</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Custo total</span>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(auditoriaInfo.custoAcumulado)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Classificação</span>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{auditoriaInfo.essencialidade}</p>
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 8px' }}>
                Assinatura ativa há bastante tempo. Vale revisar se ainda faz sentido na sua rotina.
              </p>
            )}
            <div style={{ borderTop: '1px solid rgba(200, 150, 12, 0.15)', paddingTop: 10 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                O que deseja fazer?
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onAuditoriaFeedback?.(assinatura.id, 'manter') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(47, 91, 75, 0.1)', border: '1px solid rgba(47, 91, 75, 0.3)',
                    borderRadius: 6, padding: '5px 12px', fontSize: '0.76rem', cursor: 'pointer',
                    color: 'var(--accent-2)', fontWeight: 500, transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(47, 91, 75, 0.18)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(47, 91, 75, 0.1)' }}
                >
                  ✅ Manter
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAuditoriaFeedback?.(assinatura.id, 'nao_utilizo') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(240, 90, 60, 0.08)', border: '1px solid rgba(240, 90, 60, 0.25)',
                    borderRadius: 6, padding: '5px 12px', fontSize: '0.76rem', cursor: 'pointer',
                    color: 'var(--accent)', fontWeight: 500, transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240, 90, 60, 0.15)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(240, 90, 60, 0.08)' }}
                >
                  🚫 Não utilizo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip fora do card — não sofre clipping */}
      {tooltipOpen && reajuste && (
        <div
          className="assinatura-card__reajuste-tooltip"
          style={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translateY(-100%)',
          }}
        >
          <span>
            {isAumento ? 'Aumento' : 'Redução'} de{' '}
            <strong>{Math.abs(reajuste.percentualAumento).toFixed(1)}%</strong> no valor.
          </span>
          <span>
            Impacto: {isAumento ? '+' : '-'}
            {formatCurrency(Math.abs(reajuste.impactoAnual))}/ano
          </span>
        </div>
      )}

      {menuOpen && (
        <div
          className="account-card__dropdown"
          ref={menuRef}
          style={{ position: 'absolute', right: 12, top: 54, zIndex: 50 }}
        >
          <button
            className="account-card__dropdown-item"
            onClick={() => { setMenuOpen(false); onEdit(assinatura) }}
          >
            ✏️ Editar
          </button>
          <button
            className="account-card__dropdown-item"
            onClick={() => { setMenuOpen(false); onPauseResume(assinatura) }}
          >
            {assinatura.ativo ? '\u23F8 Pausar' : '\u25B6 Reativar'}
          </button>
          <button
            className="account-card__dropdown-item account-card__dropdown-item--danger"
            onClick={() => { setMenuOpen(false); onDelete(assinatura) }}
          >
            🗑️ Excluir
          </button>
        </div>
      )}
    </div>
  )
}
