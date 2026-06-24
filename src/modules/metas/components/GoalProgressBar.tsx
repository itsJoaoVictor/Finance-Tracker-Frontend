import { useState, useEffect } from 'react'
import { Toast, useToast } from '../../../components/Toast'
import { metasService } from '../../../services/metasService'
import { contaService } from '../../../services/contaService'
import { Conta } from '../../../types'

interface GoalProgressBarProps {
  metaId: string
  nomeMeta: string
  valorAlvo: number
  valorAcumulado: number
  corHexadecimal: string
  onDelete?: () => void
  onDataChanged?: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function GoalProgressBar({
  metaId,
  nomeMeta,
  valorAlvo,
  valorAcumulado,
  corHexadecimal,
  onDelete,
  onDataChanged,
}: GoalProgressBarProps) {
  const percentual = valorAlvo > 0 ? Math.min((valorAcumulado / valorAlvo) * 100, 100) : 0

  // Shared
  const [contas, setContas] = useState<Conta[]>([])
  const [loadingContas, setLoadingContas] = useState(true)
  const { toasts, addToast, dismiss } = useToast()

  // Depósito
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositoValor, setDepositoValor] = useState('')
  const [depositoContaId, setDepositoContaId] = useState('')
  const [loadingDeposito, setLoadingDeposito] = useState(false)
  const [depositoErrors, setDepositoErrors] = useState<Record<string, string>>({})

  // Resgate
  const [showResgateModal, setShowResgateModal] = useState(false)
  const [resgateValor, setResgateValor] = useState('')
  const [resgateContaId, setResgateContaId] = useState('')
  const [loadingResgate, setLoadingResgate] = useState(false)
  const [resgateErrors, setResgateErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadContas() {
      try {
        const res = await contaService.getAll()
        setContas(res.data)
      } catch {
        addToast('Erro ao carregar contas.', 'error')
      } finally {
        setLoadingContas(false)
      }
    }
    loadContas()
  }, [])

  function validateDeposito(): boolean {
    const e: Record<string, string> = {}
    const valor = parseCurrencyInput(depositoValor)
    if (!depositoValor.trim() || valor <= 0) {
      e.valor = 'Valor deve ser maior que zero'
    }
    if (!depositoContaId) {
      e.contaOrigemId = 'Selecione uma conta de origem'
    }
    setDepositoErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleDepositar() {
    if (!validateDeposito()) return
    setLoadingDeposito(true)
    try {
      const valor = parseCurrencyInput(depositoValor)
      await metasService.depositar(metaId, valor, depositoContaId)
      addToast('Depósito realizado com sucesso!', 'success')
      setShowDepositModal(false)
      setDepositoValor('')
      setDepositoContaId('')
      onDataChanged?.()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao depositar.'
      addToast(msg, 'error')
    } finally {
      setLoadingDeposito(false)
    }
  }

  function validateResgate(): boolean {
    const e: Record<string, string> = {}
    const valor = parseCurrencyInput(resgateValor)
    if (!resgateValor.trim() || valor <= 0) {
      e.valor = 'Valor deve ser maior que zero'
    }
    if (valor > valorAcumulado) {
      e.valor = 'Valor não pode exceder o saldo do cofrinho'
    }
    if (!resgateContaId) {
      e.contaDestinoId = 'Selecione uma conta de destino'
    }
    setResgateErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleResgatar() {
    if (!validateResgate()) return
    setLoadingResgate(true)
    try {
      const valor = parseCurrencyInput(resgateValor)
      await metasService.resgatar(metaId, valor, resgateContaId)
      addToast('Resgate realizado com sucesso!', 'success')
      setShowResgateModal(false)
      setResgateValor('')
      setResgateContaId('')
      onDataChanged?.()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao resgatar.'
      addToast(msg, 'error')
    } finally {
      setLoadingResgate(false)
    }
  }

  return (
    <>
      <div className="meta-card">
        <div className="meta-card__header">
          <h3 className="meta-card__title">{nomeMeta}</h3>
          {onDelete && (
            <button
              type="button"
              className="meta-card__delete"
              onClick={onDelete}
              title="Excluir Cofrinho"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>

        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentual}%`, backgroundColor: corHexadecimal }}
          />
        </div>

        <div className="meta-card__values">
          <p className="meta-card__amount">
            <strong>{formatCurrency(valorAcumulado)}</strong> / {formatCurrency(valorAlvo)}
          </p>
          <p className="meta-card__percentage">{percentual.toFixed(1)}%</p>
        </div>

        <div className="meta-card__footer-actions">
          <button
            type="button"
            className="meta-card__action-btn meta-card__action-btn--deposit"
            onClick={() => setShowDepositModal(true)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Depositar
          </button>
          <button
            type="button"
            className="meta-card__action-btn meta-card__action-btn--withdraw"
            onClick={() => setShowResgateModal(true)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Resgatar
          </button>
        </div>
      </div>

      {/* Modal de Depósito */}
      {showDepositModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loadingDeposito) setShowDepositModal(false)
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__header">
              <h2 className="modal__title">Depositar em "{nomeMeta}"</h2>
              <button
                className="modal__close"
                onClick={() => setShowDepositModal(false)}
                aria-label="Fechar"
                disabled={loadingDeposito}
              >
                ✕
              </button>
            </div>

            <div className="modal__form">
              <div className="form-group">
                <label htmlFor="deposito-conta">Conta de Origem</label>
                <select
                  id="deposito-conta"
                  value={depositoContaId}
                  onChange={(e) => setDepositoContaId(e.target.value)}
                  className={depositoErrors.contaOrigemId ? 'error' : ''}
                  disabled={loadingDeposito || loadingContas}
                >
                  <option value="">
                    {loadingContas ? 'Carregando contas...' : 'Selecione uma conta'}
                  </option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} — {formatCurrency(conta.saldo)}
                    </option>
                  ))}
                </select>
                {depositoErrors.contaOrigemId && <p className="form-error">{depositoErrors.contaOrigemId}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="deposito-valor">Valor</label>
                <input
                  id="deposito-valor"
                  type="text"
                  placeholder="R$ 100,00"
                  value={depositoValor}
                  onChange={(e) => setDepositoValor(e.target.value)}
                  className={depositoErrors.valor ? 'error' : ''}
                  disabled={loadingDeposito}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDepositar()
                  }}
                />
                {depositoErrors.valor && <p className="form-error">{depositoErrors.valor}</p>}
              </div>

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDepositModal(false)}
                  disabled={loadingDeposito}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleDepositar}
                  disabled={loadingDeposito}
                >
                  {loadingDeposito ? 'Depositando...' : 'Depositar'}
                </button>
              </div>
            </div>
          </div>

          <Toast toasts={toasts} onDismiss={dismiss} />
        </div>
      )}

      {/* Modal de Resgate */}
      {showResgateModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loadingResgate) setShowResgateModal(false)
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__header">
              <h2 className="modal__title">Resgatar de "{nomeMeta}"</h2>
              <button
                className="modal__close"
                onClick={() => setShowResgateModal(false)}
                aria-label="Fechar"
                disabled={loadingResgate}
              >
                ✕
              </button>
            </div>

            <div className="modal__form">
              <p className="meta-card__amount" style={{ margin: 0, fontSize: '0.9rem' }}>
                Saldo disponível: <strong>{formatCurrency(valorAcumulado)}</strong>
              </p>

              <div className="form-group">
                <label htmlFor="resgate-conta">Conta de Destino</label>
                <select
                  id="resgate-conta"
                  value={resgateContaId}
                  onChange={(e) => setResgateContaId(e.target.value)}
                  className={resgateErrors.contaDestinoId ? 'error' : ''}
                  disabled={loadingResgate || loadingContas}
                >
                  <option value="">
                    {loadingContas ? 'Carregando contas...' : 'Selecione uma conta'}
                  </option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} — {formatCurrency(conta.saldo)}
                    </option>
                  ))}
                </select>
                {resgateErrors.contaDestinoId && <p className="form-error">{resgateErrors.contaDestinoId}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="resgate-valor">Valor</label>
                <input
                  id="resgate-valor"
                  type="text"
                  placeholder="R$ 100,00"
                  value={resgateValor}
                  onChange={(e) => setResgateValor(e.target.value)}
                  className={resgateErrors.valor ? 'error' : ''}
                  disabled={loadingResgate}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleResgatar()
                  }}
                />
                {resgateErrors.valor && <p className="form-error">{resgateErrors.valor}</p>}
              </div>

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowResgateModal(false)}
                  disabled={loadingResgate}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-submit btn-submit--resgate"
                  onClick={handleResgatar}
                  disabled={loadingResgate}
                >
                  {loadingResgate ? 'Resgatando...' : 'Resgatar'}
                </button>
              </div>
            </div>
          </div>

          <Toast toasts={toasts} onDismiss={dismiss} />
        </div>
      )}
    </>
  )
}