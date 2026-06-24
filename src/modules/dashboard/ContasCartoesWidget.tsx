import { DashboardResumo } from '../../types/dashboard'

interface ContasCartoesWidgetProps {
  contas: DashboardResumo['contas']
  cartoes: DashboardResumo['cartoes']
}

export function ContasCartoesWidget({ contas, cartoes }: ContasCartoesWidgetProps) {
  const formatar = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  return (
    <div className="widget contas-cartoes-widget">
      <h3 className="widget__header">Contas e Cartões</h3>

      <div className="contas-cartoes-widget__section">
        <h4 className="contas-cartoes-widget__subtitle">Contas</h4>
        <div className="contas-cartoes-widget__list">
          {contas.length === 0 && (
            <p className="contas-cartoes-widget__empty">Nenhuma conta ativa</p>
          )}
          {contas.map((conta) => (
            <div key={conta.id} className="contas-cartoes-widget__item">
              <div
                className="contas-cartoes-widget__color"
                style={{ backgroundColor: conta.corHexadecimal || '#888' }}
              />
              <div className="contas-cartoes-widget__info">
                <span className="contas-cartoes-widget__nome">{conta.nome}</span>
                <span className="contas-cartoes-widget__tipo">
                  {conta.tipo === 'CORRENTE' ? 'Conta Corrente' : 'Poupança'}
                </span>
              </div>
              <span className="contas-cartoes-widget__saldo">{formatar(conta.saldo)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="contas-cartoes-widget__section">
        <h4 className="contas-cartoes-widget__subtitle">Cartões</h4>
        <div className="contas-cartoes-widget__list">
          {cartoes.length === 0 && (
            <p className="contas-cartoes-widget__empty">Nenhum cartão ativo</p>
          )}
          {cartoes.map((cartao) => {
            const percentualConsumo =
              cartao.limiteDisponivel > 0
                ? Math.min(100, (cartao.faturaAtual / (cartao.faturaAtual + cartao.limiteDisponivel)) * 100)
                : 0

            return (
              <div key={cartao.id} className="contas-cartoes-widget__item">
                <div
                  className="contas-cartoes-widget__color"
                  style={{ backgroundColor: cartao.corHexadecimal || '#888' }}
                />
                <div className="contas-cartoes-widget__info">
                  <span className="contas-cartoes-widget__nome">{cartao.nome}</span>
                  <div className="contas-cartoes-widget__progress-bar">
                    <div
                      className="contas-cartoes-widget__progress-fill"
                      style={{
                        width: `${Math.min(100, percentualConsumo)}%`,
                        backgroundColor: percentualConsumo > 80 ? '#FF3B30' : '#34C759',
                      }}
                    />
                  </div>
                </div>
                <div className="contas-cartoes-widget__valores">
                  <span className="contas-cartoes-widget__fatura">{formatar(cartao.faturaAtual)}</span>
                  <span className="contas-cartoes-widget__limite">
                    Limite: {formatar(cartao.limiteDisponivel + cartao.faturaAtual)}
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