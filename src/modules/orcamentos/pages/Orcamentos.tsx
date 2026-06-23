import { useEffect, useState, useCallback } from 'react'
import { OrcamentoResumo, OrcamentoCriacaoRequest } from '../../../types'
import { orcamentoService } from '../../../services/orcamentoService'
import { CreateOrcamentoModal } from '../components/CreateOrcamentoModal'
import { Toast, useToast } from '../../../components/Toast'
import '../orcamentos.css'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const { toasts, addToast, dismiss } = useToast()

  const loadOrcamentos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orcamentoService.resumo()
      setOrcamentos(res.data)
    } catch {
      addToast('Erro ao carregar orçamentos.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrcamentos()
  }, [loadOrcamentos])

  // ─── Criar / Atualizar Orçamento ──────────────────────────────
  async function handleCreate(data: OrcamentoCriacaoRequest) {
    try {
      await orcamentoService.criarOuAtualizar(data)
      setShowCreate(false)
      addToast('Orçamento salvo com sucesso!', 'success')
      await loadOrcamentos()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao salvar orçamento.'
      addToast(msg, 'error')
      throw err
    }
  }

  function getStatusClass(percentual: number): string {
    if (percentual >= 100) return 'orcamentos-status--danger'
    if (percentual >= 80) return 'orcamentos-status--warning'
    return 'orcamentos-status--ok'
  }

  return (
    <div className="orcamentos-page">
      {/* Header */}
      <div className="orcamentos-header">
        <div>
          <h1 className="orcamentos-header__title">Orçamentos</h1>
          <p className="orcamentos-header__subtitle">Defina limites mensais por categoria</p>
        </div>
        <button
          className="btn-novo-orcamento"
          onClick={() => setShowCreate(true)}
          id="btn-novo-orcamento"
        >
          + Novo Orçamento
        </button>
      </div>

      {/* Tabela de Orçamentos */}
      {loading && orcamentos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Carregando orçamentos...
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="orcamentos-empty">
          <p>Nenhum orçamento definido. Crie seu primeiro orçamento!</p>
        </div>
      ) : (
        <div className="orcamentos-table-wrapper">
          <table className="orcamentos-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Limite Mensal</th>
                <th>Total Gasto</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orc) => {
                const percentual = orc.limiteMensal > 0
                  ? Math.min((orc.totalGasto / orc.limiteMensal) * 100, 100)
                  : 0
                const statusClass = getStatusClass(percentual)

                return (
                  <tr key={orc.categoriaId}>
                    <td style={{ fontWeight: 600 }}>{orc.categoriaNome}</td>
                    <td>{formatCurrency(orc.limiteMensal)}</td>
                    <td>{formatCurrency(orc.totalGasto)}</td>
                    <td className="orcamentos-progress-cell">
                      <div className="orcamentos-progress-track">
                        <div
                          className="orcamentos-progress-fill"
                          style={{
                            width: `${percentual}%`,
                            backgroundColor:
                              percentual >= 100 ? '#e03a2a' : percentual >= 80 ? '#d4a017' : '#2c9040',
                          }}
                        />
                      </div>
                      <div className={`orcamentos-progress-label ${statusClass}`}>
                        {percentual.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreate && (
        <CreateOrcamentoModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}