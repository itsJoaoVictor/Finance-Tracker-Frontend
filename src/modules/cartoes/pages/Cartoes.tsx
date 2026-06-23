import { useEffect, useState, useCallback } from 'react'
import { Cartao, CartaoCriacaoRequest, CartaoEdicaoRequest, Conta } from '../../../types'
import { cartaoService } from '../../../services/cartaoService'
import { contaService } from '../../../services/contaService'
import { CardList } from '../components/CardList'
import { CreateCardModal } from '../components/CreateCardModal'
import { EditCardModal } from '../components/EditCardModal'
import { Toast, useToast } from '../../contas/components/Toast'
import '../../contas/contas.css'
import '../cartoes.css'

export function Cartoes() {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState({
    totalLimite: 0,
    totalLimiteDisponivel: 0,
    totalFaturaEstimada: 0,
  })
  const [showCreate, setShowCreate] = useState(false)
  const [editCartao, setEditCartao] = useState<Cartao | null>(null)
  const { toasts, addToast, dismiss } = useToast()

  const loadDados = useCallback(async () => {
    setLoading(true)
    try {
      const [cartoesRes, contasRes, resumoRes] = await Promise.all([
        cartaoService.getAll(),
        contaService.getAll(),
        cartaoService.getResumo(),
      ])
      setCartoes(cartoesRes.data)
      setContas(contasRes.data)
      setResumo({
        totalLimite: resumoRes.data.totalLimite,
        totalLimiteDisponivel: resumoRes.data.totalLimiteDisponivel,
        totalFaturaEstimada: resumoRes.data.totalFaturaEstimada,
      })
    } catch {
      addToast('Erro ao carregar dados dos cartões.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDados()
  }, [loadDados])

  // ─── Criar ───────────────────────────────────────────────────
  async function handleCreate(data: CartaoCriacaoRequest) {
    try {
      const res = await cartaoService.create(data)
      const novo = res.data
      setCartoes((prev) => [...prev, novo])
      
      // Atualiza valores do resumo
      setResumo((prev) => ({
        totalLimite: prev.totalLimite + novo.limite,
        totalLimiteDisponivel: prev.totalLimiteDisponivel + novo.limiteDisponivel,
        totalFaturaEstimada: prev.totalFaturaEstimada + (novo.limite - novo.limiteDisponivel),
      }))

      setShowCreate(false)
      addToast('Cartão de crédito criado com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar cartão.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Editar ───────────────────────────────────────────────────
  async function handleEdit(id: string, data: CartaoEdicaoRequest) {
    const previousCartoes = cartoes
    const previousResumo = resumo

    // Encontra o cartão atual
    const antigo = cartoes.find((c) => c.id === id)
    if (!antigo) return

    // Recalcula limites de forma otimista
    const diferenca = data.limite - antigo.limite
    const novoDisponivel = antigo.limiteDisponivel + diferenca
    const novaFatura = data.limite - novoDisponivel

    // Atualização otimista do estado
    setCartoes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, limiteDisponivel: novoDisponivel } : c))
    )
    setResumo((prev) => ({
      totalLimite: prev.totalLimite + diferenca,
      totalLimiteDisponivel: prev.totalLimiteDisponivel + diferenca,
      totalFaturaEstimada: prev.totalFaturaEstimada + (novaFatura - (antigo.limite - antigo.limiteDisponivel)),
    }))
    setEditCartao(null)

    try {
      const res = await cartaoService.update(id, data)
      // Atualiza com os valores oficiais do servidor
      setCartoes((prev) => prev.map((c) => (c.id === id ? res.data : c)))
      
      // Recarrega o resumo oficial
      const resumoRes = await cartaoService.getResumo()
      setResumo(resumoRes.data)

      addToast('Cartão de crédito atualizado com sucesso!', 'success')
    } catch (err: unknown) {
      // Rollback
      setCartoes(previousCartoes)
      setResumo(previousResumo)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar cartão.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir ──────────────────────────────────────────────────
  async function handleDelete(cartao: Cartao) {
    if (!window.confirm(`Excluir o cartão "${cartao.nome}"?`)) return
    const previousCartoes = cartoes
    const previousResumo = resumo

    // Atualização otimista
    setCartoes((prev) => prev.filter((c) => c.id !== cartao.id))
    setResumo((prev) => ({
      totalLimite: prev.totalLimite - cartao.limite,
      totalLimiteDisponivel: prev.totalLimiteDisponivel - cartao.limiteDisponivel,
      totalFaturaEstimada: prev.totalFaturaEstimada - (cartao.limite - cartao.limiteDisponivel),
    }))

    try {
      await cartaoService.softDelete(cartao.id)
      addToast('Cartão excluído com sucesso!', 'success')
    } catch (err: unknown) {
      // Rollback
      setCartoes(previousCartoes)
      setResumo(previousResumo)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir cartão.'
      addToast(msg, 'error')
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="contas-page">
      {/* Header */}
      <div className="contas-header">
        <div>
          <h1 className="contas-header__title">Meus Cartões de Crédito</h1>
          <p className="contas-header__subtitle">Gerencie os limites e datas das faturas de seus cartões</p>
        </div>
        <button
          className="btn-nova-conta"
          onClick={() => {
            if (contas.length === 0) {
              addToast('Você precisa criar uma conta antes de cadastrar um cartão.', 'error')
            } else {
              setShowCreate(true)
            }
          }}
          id="btn-novo-cartao"
        >
          + Novo Cartão
        </button>
      </div>

      {/* Resumos */}
      <div className="contas-resumo">
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Limite Disponível</span>
          <span className="contas-resumo__value contas-resumo__value--green">
            {loading ? '...' : formatCurrency(resumo.totalLimiteDisponivel)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Limite Total</span>
          <span className="contas-resumo__value">
            {loading ? '...' : formatCurrency(resumo.totalLimite)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Fatura Estimada</span>
          <span className="contas-resumo__value" style={{ color: '#E63946' }}>
            {loading ? '...' : formatCurrency(resumo.totalFaturaEstimada)}
          </span>
        </div>
        <div className="contas-resumo__item">
          <span className="contas-resumo__label">Cartões Ativos</span>
          <span className="contas-resumo__value">{loading ? '...' : cartoes.length}</span>
        </div>
      </div>

      {/* Lista de Cartões */}
      <CardList
        cartoes={cartoes}
        contas={contas}
        loading={loading}
        onEdit={setEditCartao}
        onDelete={handleDelete}
      />

      {/* Modais */}
      {showCreate && (
        <CreateCardModal
          contas={contas}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editCartao && (
        <EditCardModal
          cartao={editCartao}
          contas={contas}
          onClose={() => setEditCartao(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
