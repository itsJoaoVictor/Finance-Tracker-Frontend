import { useState, useRef, useEffect, useCallback } from 'react'
import { Assinatura } from '../../../types'
import { ReajusteDetectado } from '../../../services/iaService'
import { FinanceCard } from '../../../components/FinanceCard'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SubscriptionCardProps {
  assinatura: Assinatura
  categoriaNome: string
  categoriaCor?: string
  categoriaIcone?: string
  cartaoNome: string
  periodicidadeLabel: string
  reajuste?: ReajusteDetectado
  onEdit: (assinatura: Assinatura) => void
  onPauseResume: (assinatura: Assinatura) => void
  onDelete: (assinatura: Assinatura) => void
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
  onEdit,
  onPauseResume,
  onDelete,
}: SubscriptionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
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
      </FinanceCard>

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
