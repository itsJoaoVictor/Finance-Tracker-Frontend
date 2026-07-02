import { useState, useEffect } from 'react'
import { iaService, SimulacaoCompraResponse } from '../../../services/iaService'
import { desejoCompraService, DesejoCompra } from '../../../services/desejoCompraService'
import { cartaoService } from '../../../services/cartaoService'
import { Cartao } from '../../../types/cartoes'
import './PlanejadorComprasModal.css'

interface PlanejadorComprasModalProps {
  onClose: () => void
}

export function PlanejadorComprasModal({ onClose }: PlanejadorComprasModalProps) {
  const [nomeItem, setNomeItem] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [parcelas, setParcelas] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<SimulacaoCompraResponse | null>(null)
  const [error, setError] = useState('')

  const [desejos, setDesejos] = useState<DesejoCompra[]>([])
  const [selectedDesejoId, setSelectedDesejoId] = useState<string>('')
  const [isSavingDesejo, setIsSavingDesejo] = useState(false)

  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [selectedCartaoId, setSelectedCartaoId] = useState<string>('')

  useEffect(() => {
    fetchDesejos()
    fetchCartoes()
  }, [])

  const fetchDesejos = async () => {
    try {
      const res = await desejoCompraService.listarDesejos()
      setDesejos(res.data)
    } catch (err) {
      console.error('Erro ao listar desejos:', err)
    }
  }

  const fetchCartoes = async () => {
    try {
      const res = await cartaoService.getAll()
      setCartoes(res.data)
    } catch (err) {
      console.error('Erro ao listar cartões:', err)
    }
  }

  const handleSelectDesejo = (id: string) => {
    setSelectedDesejoId(id)
    if (!id) {
      setNomeItem('')
      setValorTotal('')
      return
    }
    const desejo = desejos.find(d => d.id === id)
    if (desejo) {
      setNomeItem(desejo.nome)
      setValorTotal(desejo.valor.toString().replace('.', ','))
    }
  }

  const handleSalvarDesejo = async () => {
    if (!nomeItem || !valorTotal) return
    const valorParsed = parseFloat(valorTotal.replace(',', '.'))
    if (isNaN(valorParsed)) return

    setIsSavingDesejo(true)
    try {
      if (selectedDesejoId) {
        await desejoCompraService.atualizarDesejo(selectedDesejoId, nomeItem, valorParsed)
      } else {
        const res = await desejoCompraService.criarDesejo(nomeItem, valorParsed)
        setSelectedDesejoId(res.data.id)
      }
      await fetchDesejos()
      alert('Desejo salvo com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar desejo: ' + err.message)
    } finally {
      setIsSavingDesejo(false)
    }
  }

  const handleExcluirDesejo = async () => {
    if (!selectedDesejoId) return
    if (!confirm('Tem certeza que deseja excluir este desejo salvo?')) return

    setIsSavingDesejo(true)
    try {
      await desejoCompraService.deletarDesejo(selectedDesejoId)
      setSelectedDesejoId('')
      setNomeItem('')
      setValorTotal('')
      await fetchDesejos()
    } catch (err: any) {
      alert('Erro ao excluir desejo: ' + err.message)
    } finally {
      setIsSavingDesejo(false)
    }
  }

  const handleSimular = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nomeItem || !valorTotal) {
      setError('Preencha pelo menos o nome do item e o valor.')
      return
    }

    const valorParsed = parseFloat(valorTotal.replace(',', '.'))
    const parcelasParsed = parcelas ? parseInt(parcelas) : undefined

    if (isNaN(valorParsed) || (parcelasParsed !== undefined && (isNaN(parcelasParsed) || parcelasParsed <= 0))) {
      setError('Valores inválidos.')
      return
    }

    setLoading(true)
    try {
      const res = await iaService.planejarCompra(nomeItem, valorParsed, parcelasParsed, selectedCartaoId || undefined)
      setResultado(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao simular compra.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getMensagemLimpa = () => {
    if (!resultado) return { titulo: '', corpo: '' };
    let msg = resultado.mensagemRecomendacao || '';
    if (resultado.analiseCartao && resultado.analiseCartao.recomendacaoIa) {
      msg = msg.replace(resultado.analiseCartao.recomendacaoIa, '');
    }
    const linhas = msg.split('\n').map(l => l.trim()).filter(l => l !== '' && !l.startsWith('💳') && !l.startsWith('🛑 Compra Recusada') && !l.startsWith('🗓️ Timing'));
    const titulo = linhas[0] || '';
    const corpo = linhas.slice(1).join('\n\n') || '';
    return { titulo, corpo };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal planejador-modal${resultado ? ' has-result' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h2 className="modal__title">
            Simulador Inteligente de Compras
            <span className="title-robot">🤖</span>
          </h2>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </header>

        <div className="modal-body">
          {!resultado ? (
            <form onSubmit={handleSimular} className="planejador-form">
              <p className="planejador-intro">
                Planejando uma compra grande? Deixe a IA analisar se o seu orçamento vai aguentar as parcelas nos próximos meses.
              </p>

              {desejos.length > 0 && (
                <div className="form-group desejo-selector">
                  <label>Carregar Desejo Salvo</label>
                  <select
                    value={selectedDesejoId}
                    onChange={(e) => handleSelectDesejo(e.target.value)}
                  >
                    <option value="">-- Nova Simulação (Não Salvo) --</option>
                    {desejos.map(d => (
                      <option key={d.id} value={d.id}>{d.nome} - {formatCurrency(d.valor)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="cartao-selector-section">
                <div className="cartao-selector-header">
                  <span className="cartao-selector-label">💳 Cartão de Crédito</span>
                  <span className="cartao-selector-badge">✨ Smart Timing & Limite</span>
                </div>

                <div className="cartoes-grid">
                  <div
                    className={`cartao-option-card default-option ${selectedCartaoId === '' ? 'selected' : ''}`}
                    onClick={() => setSelectedCartaoId('')}
                  >
                    <div className="cartao-option-top">
                      <span className="cartao-option-name">🌐 Global / Geral</span>
                    </div>
                    {selectedCartaoId === '' && <div className="cartao-option-check">✓</div>}
                    <div className="cartao-option-bottom">
                      <span className="cartao-option-limit-label">Análise integrada</span>
                      <span className="cartao-option-limit-value">Todos os cartões</span>
                    </div>
                  </div>

                  {cartoes.map(c => {
                    const isSelected = selectedCartaoId === c.id;
                    const cor = c.corHexadecimal || '#820ad1';
                    return (
                      <div
                        key={c.id}
                        className={`cartao-option-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedCartaoId(c.id)}
                        style={isSelected ? { borderColor: cor } : {}}
                      >
                        <div className="cartao-option-top">
                          <span className="cartao-option-name" title={c.nome}>{c.nome}</span>
                          <div className="cartao-option-icon" style={{ backgroundColor: cor }}>
                            💳
                          </div>
                        </div>
                        {isSelected && (
                          <div className="cartao-option-check" style={{ backgroundColor: cor }}>
                            ✓
                          </div>
                        )}
                        <div className="cartao-option-bottom">
                          <span className="cartao-option-limit-label">Limite livre</span>
                          <span className="cartao-option-limit-value">{formatCurrency(c.limiteDisponivel)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>O que você quer comprar?</label>
                <input
                  type="text"
                  placeholder="Ex: TV 4K, Celular novo..."
                  value={nomeItem}
                  onChange={(e) => setNomeItem(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4200.00"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nº de Parcelas <span className="text-muted">(Opcional)</span></label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    placeholder="IA decide"
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="planejador-error">{error}</div>}

              <div className="planejador-actions">
                <button type="submit" className="planejador-btn-simular" disabled={loading || isSavingDesejo}>
                  {loading ? <><span className="spinner" /> Analisando histórico...</> : 'Simular com IA'}
                </button>

                <div className="planejador-actions-row">
                  <button
                    type="button"
                    className="planejador-btn-desejo"
                    onClick={handleSalvarDesejo}
                    disabled={loading || isSavingDesejo || !nomeItem || !valorTotal}
                  >
                    {isSavingDesejo ? 'Salvando...' : (selectedDesejoId ? 'Atualizar Desejo' : 'Salvar Desejo')}
                  </button>

                  {selectedDesejoId && (
                    <button
                      type="button"
                      className="planejador-btn-excluir"
                      onClick={handleExcluirDesejo}
                      disabled={loading || isSavingDesejo}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="planejador-resultado">
              {(() => {
                const { titulo, corpo } = getMensagemLimpa();
                return (
                  <div className={`resultado-banner status-${resultado.viavel ? 'verde' : 'vermelho'}`}>
                    <h3>{titulo}</h3>
                    {corpo && <p>{corpo}</p>}
                  </div>
                );
              })()}

              <div className="insights-section">
                <h4 className="insights-section-title">Estratégia e Insights da IA</h4>

                <div className="insights-grid">
                  {resultado.parcelasRecomendadas && (
                    <div className="insight-card">
                      <div className="insight-icon-circle">🤖</div>
                      <div className="insight-info">
                        <span className="insight-label">Parcelamento Recomendado</span>
                        <div className="insight-main-val">Ideal em {resultado.parcelasRecomendadas}x</div>
                        {!resultado.viavel && resultado.mesRecomendadoParaCompra && (
                          <div className="insight-badge-mes">
                            Mês ideal: <strong>{resultado.mesRecomendadoParaCompra}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!resultado.parcelasRecomendadas && !resultado.viavel && resultado.mesRecomendadoParaCompra && (
                    <div className="insight-card">
                      <div className="insight-icon-circle">💡</div>
                      <div className="insight-info">
                        <span className="insight-label">Momento Adequado</span>
                        <div className="insight-main-val">Comprar em {resultado.mesRecomendadoParaCompra}</div>
                      </div>
                    </div>
                  )}

                  {resultado.analiseCartao && (
                    <div className={`insight-card cartao-insight-card ${resultado.analiseCartao.limiteAprovado ? '' : 'card-recusado'}`}>
                      <div className="cartao-insight-header">
                        <div className="cartao-insight-name">
                          <span className="cartao-insight-emoji">💳</span>
                          <strong>{resultado.analiseCartao.cartaoNome}</strong>
                        </div>
                        <span className={`status-pill ${resultado.analiseCartao.limiteAprovado ? 'pill-green' : 'pill-red'}`}>
                          {resultado.analiseCartao.limiteAprovado ? '✓ Limite Aprovado' : '✕ Limite Insuficiente'}
                        </span>
                      </div>

                      <p className="cartao-insight-desc">
                        {resultado.analiseCartao.recomendacaoIa
                          .replace(/^💳 Limite Aprovado.*?! /g, '')
                          .replace(/^🛑 Compra Recusada.*?! /g, '')
                          .replace(/^🗓️ Timing Perfeito! /g, '')
                          .trim()}
                      </p>

                      {resultado.analiseCartao.limiteAprovado && (
                        <div className="cartao-timing-footer">
                          <div className="timing-item">
                            <span>Melhor dia:</span>
                            <strong className="timing-val">📅 {resultado.analiseCartao.melhorDiaCompra}</strong>
                          </div>
                          <div className="timing-divisor">•</div>
                          <div className="timing-item">
                            <span>Ganho de fôlego:</span>
                            <strong className="timing-val timing-val--accent2">+{resultado.analiseCartao.diasGanhoFolego} dias para pagar</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h4 className="simulacoes-section-title">Projeção Mês a Mês</h4>
              <div className="simulacoes-list">
                {resultado.simulacoesMesAMes.map((mes, idx) => (
                  <div key={idx} className={`mes-card status-border-${mes.status.toLowerCase()}`}>
                    <div className="mes-header">
                      <strong>{mes.mesAno}</strong>
                      <span className={`badge-status badge-${mes.status.toLowerCase()}`}>
                        {mes.status}
                      </span>
                    </div>
                    <div className="mes-details">
                      <div className="detail-row">
                        <span>Renda Projetada:</span>
                        <span>{formatCurrency(mes.receitaProjetada)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Custo de Vida Base:</span>
                        <span>{formatCurrency(mes.despesaFixaProjetada)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Faturas Projetadas (Todos):</span>
                        <span className="negative">-{formatCurrency(mes.faturasProjetadas)}</span>
                      </div>
                      {mes.faturasProjetadasCartao !== undefined && mes.faturasProjetadasCartao !== null && (
                        <div className="detail-row sub-detail">
                          <span>└ Fatura ({resultado.analiseCartao ? resultado.analiseCartao.cartaoNome : 'Cartão'}):</span>
                          <span className="negative">-{formatCurrency(mes.faturasProjetadasCartao)}</span>
                        </div>
                      )}
                      {mes.limiteRestanteCartao !== undefined && mes.limiteRestanteCartao !== null && (
                        <div className="detail-row sub-detail">
                          <span>└ Limite Restante ({resultado.analiseCartao ? resultado.analiseCartao.cartaoNome : 'Cartão'}):</span>
                          <span style={{ color: mes.limiteRestanteCartao < 0 ? '#dc2626' : '#059669' }}>
                            {formatCurrency(mes.limiteRestanteCartao)}
                          </span>
                        </div>
                      )}
                      <div className="detail-row highlight-row">
                        <span>Nova Parcela:</span>
                        <span className="negative">-{formatCurrency(mes.novaParcela)}</span>
                      </div>
                      <div className="detail-row total-row">
                        <span>Saldo Livre Estimado:</span>
                        <span className={mes.saldoLivre < 0 ? 'negative' : 'positive'}>
                          {formatCurrency(mes.saldoLivre)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="planejador-btn-voltar" onClick={() => setResultado(null)}>
                Fazer outra simulação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
