import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, CreditCard, ArrowRight, Sparkles } from 'lucide-react'
import { DashboardResumo } from '../../types/dashboard'
import { Cartao } from '../../types/cartoes'
import { cartaoService } from '../../services/cartaoService'
import { calcularMelhorCartao } from './utils/melhorCartao'
import { MelhorCartaoCard } from './MelhorCartaoCard'

interface ContasCartoesWidgetProps {
  contas: DashboardResumo['contas']
  cartoes: DashboardResumo['cartoes']
  ocultarValores?: boolean
}

export function ContasCartoesWidget({ contas, cartoes, ocultarValores = false }: ContasCartoesWidgetProps) {
  const navigate = useNavigate()
  const [cartoesCompletos, setCartoesCompletos] = useState<Cartao[]>([])
  const [loadingCartoes, setLoadingCartoes] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoadingCartoes(true)
    cartaoService
      .getAll()
      .then((res) => {
        if (isMounted) setCartoesCompletos(res.data || [])
      })
      .catch((err) => {
        console.error('Erro ao carregar dados dos cartões para recomendação:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingCartoes(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const resultadoMelhorCartao = useMemo(() => {
    if (cartoesCompletos.length > 0) {
      return calcularMelhorCartao(cartoesCompletos)
    }
    // Fallback inicial enquanto os cartões completos carregam
    return calcularMelhorCartao([])
  }, [cartoesCompletos])

  const formatar = (valor: number) => {
    if (ocultarValores) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  return (
    <div className="widget contas-cartoes-widget">
      <div className="widget__header-row">
        <div className="widget__header-title">
          <Landmark size={18} className="widget__header-icon" />
          <h3 className="widget__header" style={{ margin: 0 }}>Contas e Cartões</h3>
        </div>
      </div>

      <div className="contas-cartoes-widget__section">
        <div className="contas-cartoes-widget__section-header">
          <h4 className="contas-cartoes-widget__subtitle">Contas Bancárias</h4>
          <button
            type="button"
            className="widget__action-link widget__action-link--sm"
            onClick={() => navigate('/contas')}
          >
            <span>Ver contas</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="contas-cartoes-widget__list">
          {contas.length === 0 && (
            <p className="contas-cartoes-widget__empty">Nenhuma conta ativa</p>
          )}
          {contas.map((conta) => (
            <div
              key={conta.id}
              className="contas-cartoes-widget__item"
              onClick={() => navigate('/contas')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/contas')
              }}
            >
              <div
                className="contas-cartoes-widget__color"
                style={{ backgroundColor: conta.corHexadecimal || '#64748b' }}
              />
              <div className="contas-cartoes-widget__info">
                <span className="contas-cartoes-widget__nome">{conta.nome}</span>
                <span className="contas-cartoes-widget__tipo">
                  {conta.tipo === 'CORRENTE' ? 'Conta Corrente' : 'Poupança'}
                </span>
              </div>
              <span
                className={`contas-cartoes-widget__saldo ${
                  conta.saldo < 0 ? 'contas-cartoes-widget__saldo--negativo' : ''
                }`}
              >
                {formatar(conta.saldo)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="contas-cartoes-widget__section">
        <div className="contas-cartoes-widget__section-header">
          <h4 className="contas-cartoes-widget__subtitle">
            <CreditCard size={13} style={{ marginRight: 4 }} />
            Cartões de Crédito
          </h4>
          <button
            type="button"
            className="widget__action-link widget__action-link--sm"
            onClick={() => navigate('/cartoes')}
          >
            <span>Ver cartões</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Recomendador Inteligente: Qual Cartão Usar Hoje? */}
        {cartoes.length > 0 && (
          <MelhorCartaoCard
            resultado={resultadoMelhorCartao}
            loading={loadingCartoes && cartoesCompletos.length === 0}
            ocultarValores={ocultarValores}
          />
        )}

        <div className="contas-cartoes-widget__list">
          {cartoes.length === 0 && (
            <p className="contas-cartoes-widget__empty">Nenhum cartão ativo</p>
          )}
          {cartoes.map((cartao) => {
            const limiteTotal = cartao.faturaAtual + cartao.limiteDisponivel
            const percentualConsumo =
              limiteTotal > 0 ? Math.min(100, (cartao.faturaAtual / limiteTotal) * 100) : 0
            const pctRound = Math.round(percentualConsumo)

            const info = resultadoMelhorCartao.comparativo.find((c) => c.id === cartao.id)
            const isMelhorHoje = info?.isMelhor

            const statusClass =
              percentualConsumo > 80
                ? 'contas-cartoes-widget__fatura--critico'
                : percentualConsumo > 55
                ? 'contas-cartoes-widget__fatura--alerta'
                : 'contas-cartoes-widget__fatura--normal'

            const barColor =
              percentualConsumo > 80
                ? 'var(--danger, #e11d48)'
                : percentualConsumo > 55
                ? 'var(--warning, #f59e0b)'
                : 'var(--primary, #10b981)'

            return (
              <div
                key={cartao.id}
                className={`contas-cartoes-widget__item ${
                  isMelhorHoje ? 'contas-cartoes-widget__item--destaque' : ''
                }`}
                onClick={() => navigate('/cartoes')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate('/cartoes')
                }}
              >
                <div
                  className="contas-cartoes-widget__color"
                  style={{ backgroundColor: cartao.corHexadecimal || '#64748b' }}
                />
                <div className="contas-cartoes-widget__info">
                  <div className="contas-cartoes-widget__card-head">
                    <div className="contas-cartoes-widget__name-group">
                      <span className="contas-cartoes-widget__nome">{cartao.nome}</span>
                      {isMelhorHoje && (
                        <span className="contas-cartoes-widget__badge-melhor" title="Melhor prazo para compras hoje">
                          <Sparkles size={10} />
                          Melhor hoje
                        </span>
                      )}
                    </div>
                    <span className="contas-cartoes-widget__pct">{pctRound}% usado</span>
                  </div>

                  <div className="contas-cartoes-widget__progress-bar">
                    <div
                      className="contas-cartoes-widget__progress-fill"
                      style={{
                        width: `${Math.min(100, percentualConsumo)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>

                  {info && (
                    <div className="contas-cartoes-widget__corte-meta">
                      <span>Fecha dia {info.diaFechamento} (em {info.diasAteFechamento}d)</span>
                      <span>•</span>
                      <span>{info.diasAtePagar}d p/ pagar</span>
                    </div>
                  )}
                </div>
                <div className="contas-cartoes-widget__valores">
                  <span className={`contas-cartoes-widget__fatura ${statusClass}`}>
                    {formatar(cartao.faturaAtual)}
                  </span>
                  <span className="contas-cartoes-widget__limite">
                    Limite: {formatar(limiteTotal)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
