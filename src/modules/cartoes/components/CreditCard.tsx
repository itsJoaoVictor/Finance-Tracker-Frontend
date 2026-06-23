import { useState, useRef, useEffect } from 'react'
import { Cartao, Conta } from '../../../types'
import '../cartoes.css'

interface CreditCardProps {
  cartao: Cartao
  contas: Conta[]
  onEdit: (cartao: Cartao) => void
  onDelete: (cartao: Cartao) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function CreditCard({ cartao, contas, onEdit, onDelete }: CreditCardProps) {
  const [limitVisible, setLimitVisible] = useState(true)
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

  const contaVinculada = contas.find((c) => c.id === cartao.contaId)
  const nomeConta = contaVinculada ? contaVinculada.nome : 'Sem conta'

  const limiteConsumido = cartao.limite - cartao.limiteDisponivel
  const porcentagemConsumida = cartao.limite > 0 ? Math.min((limiteConsumido / cartao.limite) * 100, 100) : 0

  // Cores dinâmicas para o gradiente do cartão
  const cardColor = cartao.corHexadecimal || '#8A05BE'
  const cardBgStyle = {
    background: `linear-gradient(135deg, ${cardColor} 0%, rgba(20, 20, 20, 0.85) 100%), ${cardColor}`
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '360px' }}>
      {/* CARTÃO FÍSICO SIMULADO */}
      <div className="physical-card" style={cardBgStyle}>
        
        {/* Topo do cartão */}
        <div className="physical-card__top">
          <div className="physical-card__brand">
            💳 Cartão de Crédito
          </div>
          
          <button
            type="button"
            className="physical-card__options-btn"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((o) => !o)
            }}
            aria-label="Opções"
          >
            ···
          </button>
        </div>

        {/* Chip e Contactless */}
        <div className="physical-card__chip-row">
          <div className="physical-card__chip" />
          <div className="physical-card__contactless">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12a10 10 0 0 1 5-8.66" />
              <path d="M3 12a14 14 0 0 1 7-12.12" />
              <path d="M7 12a6 6 0 0 1 3-5.19" />
              <circle cx="11" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Info do Limite Disponível */}
        <div className="physical-card__limit-info">
          <span className="physical-card__label">Limite Disponível</span>
          <div className="physical-card__limit-val">
            <span>{limitVisible ? formatCurrency(cartao.limiteDisponivel) : '•••••••'}</span>
            <button
              type="button"
              className="physical-card__toggle-btn"
              onClick={(e) => {
                e.stopPropagation()
                setLimitVisible((v) => !v)
              }}
              aria-label={limitVisible ? 'Ocultar limite' : 'Exibir limite'}
            >
              {limitVisible ? '👁' : '🙈'}
            </button>
          </div>
        </div>

        {/* Rodapé do cartão */}
        <div className="physical-card__bottom">
          <div className="physical-card__holder">
            <span className="physical-card__label">Identificação</span>
            <span className="physical-card__name">{cartao.nome}</span>
          </div>
        </div>

      </div>

      {/* PAINEL DE DETALHES ABAIXO DO CARTÃO */}
      <div className="card-details-panel">
        
        {/* Métricas formatadas em grid */}
        <div className="card-details-panel__stats">
          <div className="card-details-panel__stat-item">
            <span className="card-details-panel__stat-label">Consumido</span>
            <span className="card-details-panel__stat-value" style={{ color: limiteConsumido > 0 ? '#E63946' : 'var(--ink)' }}>
              {formatCurrency(limiteConsumido)}
            </span>
          </div>
          <div className="card-details-panel__stat-item">
            <span className="card-details-panel__stat-label">Total do Limite</span>
            <span className="card-details-panel__stat-value">
              {formatCurrency(cartao.limite)}
            </span>
          </div>
          <div className="card-details-panel__stat-item">
            <span className="card-details-panel__stat-label">Fechamento</span>
            <span className="card-details-panel__stat-value">
              Dia {cartao.diaFechamento}
            </span>
          </div>
          <div className="card-details-panel__stat-item">
            <span className="card-details-panel__stat-label">Vencimento</span>
            <span className="card-details-panel__stat-value">
              Dia {cartao.diaVencimento}
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="card-details-panel__progress-wrapper">
          <div className="card-details-panel__progress-bar">
            <div
              className="card-details-panel__progress-fill"
              style={{
                background: cartao.corHexadecimal || '#8A05BE',
                width: `${porcentagemConsumida}%`
              }}
            />
          </div>
        </div>

        {/* Rodapé do painel */}
        <div className="card-details-panel__footer">
          <div className="card-details-panel__account">
            🔗 {nomeConta}
          </div>
          <div className="card-details-panel__percentage">
            {porcentagemConsumida.toFixed(0)}% Utilizado
          </div>
        </div>

      </div>

      {/* Menu dropdown posicionado sobreposto */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="account-card__dropdown"
          style={{ position: 'absolute', top: 50, right: 16, zIndex: 10 }}
        >
          <button
            type="button"
            className="account-card__dropdown-item"
            onClick={() => { setMenuOpen(false); onEdit(cartao) }}
          >
            ✏️ Editar
          </button>
          <button
            type="button"
            className="account-card__dropdown-item account-card__dropdown-item--danger"
            onClick={() => { setMenuOpen(false); onDelete(cartao) }}
          >
            🗑️ Excluir
          </button>
        </div>
      )}
    </div>
  )
}
