import { useState, useRef, useEffect } from 'react'
import { Cartao, Conta } from '../../../types'
import { FinanceCard } from '../../../components/FinanceCard'

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

  return (
    <div style={{ position: 'relative' }}>
      <FinanceCard
        titulo={cartao.nome}
        subtitulo={`Vence todo dia ${cartao.diaVencimento}`}
        valorPrincipal={limitVisible ? formatCurrency(cartao.limiteDisponivel) : '•••••••'}
        corHexadecimal={cartao.corHexadecimal || '#8A05BE'}
        icone="💳"
        badgeText={`🔗 ${nomeConta}`}
        onClickOptions={(e) => {
          e.stopPropagation()
          setMenuOpen((o) => !o)
        }}
      >
        {/* Toggle de visibilidade do limite */}
        <button
          className="account-card__toggle-btn"
          onClick={() => setLimitVisible((v) => !v)}
          style={{ position: 'absolute', right: 22, bottom: 90, zIndex: 2 }}
          aria-label={limitVisible ? 'Ocultar limite' : 'Exibir limite'}
        >
          {limitVisible ? '👁' : '🙈'}
        </button>

        {/* ProgressBar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
            <span>Limite Consumido: {formatCurrency(limiteConsumido)}</span>
            <span>Total: {formatCurrency(cartao.limite)}</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 10, height: 6, width: '100%', overflow: 'hidden' }}>
            <div
              style={{
                background: cartao.corHexadecimal || '#8A05BE',
                height: '100%',
                width: `${porcentagemConsumida}%`,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginTop: 8 }}>
            <span>Fechamento: Dia {cartao.diaFechamento}</span>
            <span>Consumo: {porcentagemConsumida.toFixed(0)}%</span>
          </div>
        </div>
      </FinanceCard>

      {/* Menu dropdown absolute posicionado fora do FinanceCard para não cortar */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="account-card__dropdown"
          style={{ position: 'absolute', top: 50, right: 22, zIndex: 10 }}
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
