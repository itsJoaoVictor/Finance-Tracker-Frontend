import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { ResultadoMelhorCartao, ComparacaoCartao } from './utils/melhorCartao'

interface MelhorCartaoCardProps {
  resultado: ResultadoMelhorCartao
  loading?: boolean
  ocultarValores?: boolean
}

export function MelhorCartaoCard({ resultado, loading = false, ocultarValores = false }: MelhorCartaoCardProps) {
  const navigate = useNavigate()
  const [expandido, setExpandido] = useState(false)

  const formatarValor = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(data)
  }

  if (loading) {
    return (
      <div className="melhor-cartao-card melhor-cartao-card--loading">
        <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 22, width: '70%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 6 }} />
      </div>
    )
  }

  const { melhorCartao, comparativo, totalCartoes, todosSemLimite } = resultado

  if (!melhorCartao || totalCartoes === 0) {
    return null
  }

  if (todosSemLimite) {
    return (
      <div className="melhor-cartao-card melhor-cartao-card--alerta">
        <div className="melhor-cartao-card__head">
          <div className="melhor-cartao-card__badge melhor-cartao-card__badge--alerta">
            <AlertCircle size={13} />
            <span>Limite Indisponível</span>
          </div>
        </div>
        <p className="melhor-cartao-card__msg-alerta">
          Todos os seus cartões cadastrados atingiram o limite disponível no momento. Recomendamos pagar as faturas abertas antes de realizar novas compras.
        </p>
      </div>
    )
  }

  return (
    <div className="melhor-cartao-card">
      <div className="melhor-cartao-card__header">
        <div className="melhor-cartao-card__tag">
          <Sparkles size={12} className="melhor-cartao-card__spark-icon" />
          <span>Qual Cartão Usar Hoje?</span>
        </div>

        {totalCartoes > 1 && (
          <button
            type="button"
            className="melhor-cartao-card__toggle-btn"
            onClick={() => setExpandido(!expandido)}
            aria-expanded={expandido}
            title={expandido ? 'Ocultar comparação' : 'Comparar todos os cartões'}
          >
            <span>{expandido ? 'Menos detalhes' : 'Comparar cartões'}</span>
            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className="melhor-cartao-card__body">
        <div className="melhor-cartao-card__title-row">
          <div
            className="melhor-cartao-card__color-dot"
            style={{ backgroundColor: melhorCartao.corHexadecimal || '#10b981' }}
          />
          <h4 className="melhor-cartao-card__title">
            Melhor cartão hoje: <strong>{melhorCartao.nome}</strong>
          </h4>
        </div>

        <p className="melhor-cartao-card__frase">
          A fatura fecha em <strong>{melhorCartao.diasAteFechamento} {melhorCartao.diasAteFechamento === 1 ? 'dia' : 'dias'}</strong> — você ganha até <strong>{melhorCartao.diasAtePagar} dias</strong> para pagar!
        </p>

        <div className="melhor-cartao-card__metrics">
          <div className="melhor-cartao-card__metric-item">
            <span className="melhor-cartao-card__metric-label">Limite livre</span>
            <span className="melhor-cartao-card__metric-val">{formatarValor(melhorCartao.limiteDisponivel)}</span>
          </div>

          <div className="melhor-cartao-card__metric-sep" />

          <div className="melhor-cartao-card__metric-item">
            <span className="melhor-cartao-card__metric-label">Fecha fatura</span>
            <span className="melhor-cartao-card__metric-val">
              Dia {melhorCartao.diaFechamento} ({formatarData(melhorCartao.dataFechamento)})
            </span>
          </div>

          <div className="melhor-cartao-card__metric-sep" />

          <div className="melhor-cartao-card__metric-item">
            <span className="melhor-cartao-card__metric-label">Vencimento</span>
            <span className="melhor-cartao-card__metric-val">
              Dia {melhorCartao.diaVencimento} ({formatarData(melhorCartao.dataVencimento)})
            </span>
          </div>
        </div>
      </div>

      {expandido && totalCartoes > 1 && (
        <div className="melhor-cartao-card__drawer">
          <div className="melhor-cartao-card__drawer-header">
            <span>Comparativo de prazo e corte</span>
            <button
              type="button"
              className="melhor-cartao-card__drawer-link"
              onClick={() => navigate('/cartoes')}
            >
              <span>Gerenciar cartões</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="melhor-cartao-card__comparison-list">
            {comparativo.map((cartao: ComparacaoCartao) => (
              <div
                key={cartao.id}
                className={`melhor-cartao-card__comparison-item ${
                  cartao.isMelhor ? 'melhor-cartao-card__comparison-item--best' : ''
                }`}
              >
                <div className="melhor-cartao-card__comparison-main">
                  <div
                    className="melhor-cartao-card__color-dot"
                    style={{ backgroundColor: cartao.corHexadecimal || '#64748b' }}
                  />
                  <div className="melhor-cartao-card__comparison-info">
                    <div className="melhor-cartao-card__comparison-name-row">
                      <span className="melhor-cartao-card__comparison-name">{cartao.nome}</span>
                      {cartao.isMelhor && (
                        <span className="melhor-cartao-card__best-badge">
                          <ShieldCheck size={11} />
                          Recomendado
                        </span>
                      )}
                      {cartao.semLimite && (
                        <span className="melhor-cartao-card__bad-badge">Sem limite</span>
                      )}
                    </div>
                    <span className="melhor-cartao-card__comparison-sub">
                      Fecha em {cartao.diasAteFechamento}d (dia {cartao.diaFechamento}) • Disp: {formatarValor(cartao.limiteDisponivel)}
                    </span>
                  </div>
                </div>

                <div className="melhor-cartao-card__comparison-prazo">
                  <span className="melhor-cartao-card__prazo-num">{cartao.diasAtePagar}d</span>
                  <span className="melhor-cartao-card__prazo-label">p/ pagar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
