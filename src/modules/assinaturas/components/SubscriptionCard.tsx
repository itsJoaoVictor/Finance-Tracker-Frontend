import { useState, useRef, useEffect } from 'react'
import { Assinatura } from '../../../types'
import { FinanceCard } from '../../../components/FinanceCard'

interface SubscriptionCardProps {
  assinatura: Assinatura
  categoriaNome: string
  categoriaCor?: string
  categoriaIcone?: string
  cartaoNome: string
  periodicidadeLabel: string
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
  onEdit,
  onPauseResume,
  onDelete,
}: SubscriptionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Normaliza o nome da assinatura para gerar a URL do logotipo dinamicamente
  const cleanName = assinatura.nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .split(/\s+/)[0] // pega a primeira palavra

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

  return (
    <div style={{ position: 'relative' }}>
      <FinanceCard
        titulo={assinatura.nome}
        subtitulo={`${categoriaNome} \u2022 ${periodicidadeLabel}`}
        valorPrincipal={formatCurrency(assinatura.valor)}
        corHexadecimal={cardColor}
        icone={iconNode}
        badgeText={badgeText}
        onClickOptions={() => setMenuOpen((o) => !o)}
      >
        <p className="assinatura-card__proxima">
          Pr&oacute;xima cobran&ccedil;a: {formatDate(assinatura.dataProximaCobranca)}
        </p>
        <p className="assinatura-card__cartao">
          Cart&atilde;o: {cartaoNome}
        </p>
      </FinanceCard>

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
