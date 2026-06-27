import { useEffect, useState, useCallback } from 'react'
import {
  Assinatura,
  AssinaturaCriacaoRequest,
  AssinaturaEdicaoRequest,
  AssinaturaProxima,
  Cartao,
  Category,
} from '../../../types'
import { assinaturaService } from '../../../services/assinaturaService'
import { cartaoService } from '../../../services/cartaoService'
import { categoryService } from '../../../services/categoryService'
import { SubscriptionCard } from '../components/SubscriptionCard'
import { CreateSubscriptionModal } from '../components/CreateSubscriptionModal'
import { EditSubscriptionModal } from '../components/EditSubscriptionModal'
import { Toast, useToast } from '../../contas/components/Toast'
import '../assinaturas.css'

import { iaService, ReajusteDetectado } from '../../../services/iaService'
import { FadigaInsights } from '../components/FadigaInsights'

const PERIODICIDADE_LABEL: Record<string, string> = {
  MENSAL: 'Mensal',
  ANUAL: 'Anual',
  TRIMESTRAL: 'Trimestral',
  PERSONALIZADO: 'Personalizado',
}

function getPeriodicidadeLabel(assinatura: Assinatura): string {
  const base = PERIODICIDADE_LABEL[assinatura.tipoRecorrencia] || assinatura.tipoRecorrencia
  if (assinatura.tipoRecorrencia === 'PERSONALIZADO' && assinatura.frequencia && assinatura.unidadeFrequencia) {
    const unidadeLabel: Record<string, string> = {
      SEMANAS: assinatura.frequencia > 1 ? 'Semanas' : 'Semana',
      MESES: assinatura.frequencia > 1 ? 'Meses' : 'M\u00eas',
      ANOS: assinatura.frequencia > 1 ? 'Anos' : 'Ano',
    }
    return `${base} (a cada ${assinatura.frequencia} ${unidadeLabel[assinatura.unidadeFrequencia] || assinatura.unidadeFrequencia})`
  }
  return base
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

export function Assinaturas() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [categorias, setCategorias] = useState<Category[]>([])
  const [proximas, setProximas] = useState<AssinaturaProxima[]>([])
  const [loading, setLoading] = useState(true)
  const [proximasDias, setProximasDias] = useState(7)
  const [showCreate, setShowCreate] = useState(false)
  const [editAssinatura, setEditAssinatura] = useState<Assinatura | null>(null)
  const [processandoIa, setProcessandoIa] = useState(false)
  const [reajusteMap, setReajusteMap] = useState<Map<string, ReajusteDetectado>>(new Map())
  const { toasts, addToast, dismiss } = useToast()

  // Cria um mapa de cartaoId -> nome para lookup r\u00e1pido
  const cartaoMap = new Map(cartoes.map((c) => [c.id, c.nome]))
  const categoryObjMap = new Map(categorias.map((c) => [c.id, c]))

  const loadDados = useCallback(async () => {
    setLoading(true)
    try {
      const [assinaturasRes, cartoesRes, categoriasRes] = await Promise.all([
        assinaturaService.getAll(),
        cartaoService.getAll(),
        categoryService.getAll(true),
      ])
      setAssinaturas(assinaturasRes.data)
      setCartoes(cartoesRes.data)
      setCategorias(categoriasRes.data)

      // Buscar reajustes detectados
      iaService.getInteligenciaAssinatura()
        .then(res => {
          const map = new Map<string, ReajusteDetectado>()
          for (const r of res.data.reajustes) {
            map.set(r.assinaturaId, r)
          }
          setReajusteMap(map)
        })
        .catch(() => {})
    } catch {
      addToast('Erro ao carregar assinaturas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProximas = useCallback(async (dias: number) => {
    try {
      const res = await assinaturaService.getProximas(dias)
      setProximas(res.data)
    } catch {
      // Silently fail for the proximas section
    }
  }, [])

  useEffect(() => {
    loadDados()
  }, [loadDados])

  useEffect(() => {
    loadProximas(proximasDias)
  }, [proximasDias, loadProximas])

  // ─── Criar ───────────────────────────────────────────────────
  async function handleCreate(data: AssinaturaCriacaoRequest) {
    try {
      const res = await assinaturaService.create(data)
      setAssinaturas((prev) => [...prev, res.data])
      setShowCreate(false)
      addToast('Assinatura criada com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar assinatura.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Editar ───────────────────────────────────────────────────
  async function handleEdit(id: string, data: AssinaturaEdicaoRequest) {
    const previous = assinaturas
    setAssinaturas((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
    setEditAssinatura(null)
    try {
      const res = await assinaturaService.update(id, data)
      setAssinaturas((prev) => prev.map((a) => (a.id === id ? res.data : a)))
      addToast('Assinatura atualizada com sucesso!', 'success')
    } catch (err: unknown) {
      setAssinaturas(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao atualizar assinatura.'
      addToast(msg, 'error')
      throw err
    }
  }

  // ─── Excluir ──────────────────────────────────────────────────
  async function handleDelete(assinatura: Assinatura) {
    if (!window.confirm(`Excluir a assinatura "${assinatura.nome}"?`)) return
    const previous = assinaturas
    setAssinaturas((prev) => prev.filter((a) => a.id !== assinatura.id))
    try {
      await assinaturaService.excluir(assinatura.id)
      addToast('Assinatura excluída com sucesso!', 'success')
    } catch (err: unknown) {
      setAssinaturas(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao excluir assinatura.'
      addToast(msg, 'error')
    }
  }

  // ─── Pausar / Reativar ───────────────────────────────────────
  async function handlePauseResume(assinatura: Assinatura) {
    const previous = assinaturas
    setAssinaturas((prev) =>
      prev.map((a) => (a.id === assinatura.id ? { ...a, ativo: !a.ativo } : a))
    )
    try {
      if (assinatura.ativo) {
        await assinaturaService.pausar(assinatura.id)
        addToast('Assinatura pausada com sucesso!', 'success')
      } else {
        await assinaturaService.reativar(assinatura.id)
        addToast('Assinatura reativada com sucesso!', 'success')
      }
    } catch (err: unknown) {
      setAssinaturas(previous)
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao alterar status da assinatura.'
      addToast(msg, 'error')
    }
  }

  async function handleAnalisarIa() {
    setProcessandoIa(true)
    try {
      await iaService.processarInsights()
      addToast('Análise completa da IA concluída! Verifique os insights no robô 🤖 no topo.', 'success')
    } catch {
      addToast('Erro ao processar análise da IA.', 'error')
    } finally {
      setProcessandoIa(false)
    }
  }

  const ativas = assinaturas.filter((a) => a.ativo)
  const inativas = assinaturas.filter((a) => !a.ativo)

  return (
    <div className="assinaturas-page">
      {/* Header */}
      <div className="assinaturas-header">
        <div>
          <h1 className="assinaturas-header__title">Assinaturas</h1>
          <p className="assinaturas-header__subtitle">
            Gerencie suas assinaturas e acompanhe os próximos vencimentos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-nova-assinatura"
            onClick={handleAnalisarIa}
            disabled={processandoIa || loading}
            style={{ background: 'rgba(138, 5, 190, 0.15)', border: '1px solid var(--primary)', color: 'var(--primary-light)' }}
          >
            {processandoIa ? '🤖 Analisando...' : '🤖 Analisar com IA'}
          </button>
          <button
            className="btn-nova-assinatura"
            onClick={() => setShowCreate(true)}
            id="btn-nova-assinatura"
          >
            + Adicionar Assinatura
          </button>
        </div>
      </div>

      {/* Insights de Fadiga — hero element */}
      <FadigaInsights />

      {/* Próximas Cobranças */}
      <div className="assinaturas-proximas">
        <div className="assinaturas-proximas__header">
          <h2 className="assinaturas-proximas__title">Próximas Cobranças</h2>
          <div className="assinaturas-proximas__filter">
            {[7, 15, 30].map((d) => (
              <button
                key={d}
                className={`assinaturas-proximas__filter-btn ${proximasDias === d ? 'assinaturas-proximas__filter-btn--active' : ''}`}
                onClick={() => setProximasDias(d)}
              >
                {d} dias
              </button>
            ))}
          </div>
        </div>

        {proximas.length === 0 ? (
          <p className="assinaturas-proximas__empty">
            Nenhuma cobrança nos próximos {proximasDias} dias.
          </p>
        ) : (
          <div className="assinaturas-proximas__list">
            {proximas.map((p) => (
              <div key={p.id} className="proxima-item">
                <div className="proxima-item__info">
                  <p className="proxima-item__nome">{p.nome}</p>
                  <p className="proxima-item__data">
                    {formatDate(p.dataProximaCobranca)}
                    {p.diasRestantes === 0
                      ? ' (hoje)'
                      : p.diasRestantes === 1
                        ? ' (amanh\u00e3)'
                        : ` (em ${p.diasRestantes} dias)`}
                  </p>
                </div>
                <span className="proxima-item__valor">{formatCurrency(p.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assinaturas Ativas */}
      <div>
        <h3 className="assinaturas-section__title">Ativas</h3>
        {loading ? (
          <div className="assinaturas-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="account-card account-card--skeleton" style={{ minHeight: 180 }} />
            ))}
          </div>
        ) : ativas.length === 0 ? (
          <div className="assinaturas-grid">
            <div className="assinaturas-grid--empty">
              <p>Nenhuma assinatura ativa.</p>
              <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                Clique em <strong>+ Adicionar Assinatura</strong> para come&ccedil;ar.
              </p>
            </div>
          </div>
        ) : (
          <div className="assinaturas-grid">
            {ativas.map((a) => {
              const catObj = categoryObjMap.get(a.categoriaId)
              return (
                <SubscriptionCard
                  key={a.id}
                  assinatura={a}
                  categoriaNome={catObj?.nome || 'Sem categoria'}
                  categoriaCor={catObj?.corHexadecimal}
                  categoriaIcone={catObj?.icone}
                  cartaoNome={cartaoMap.get(a.cartaoId) || 'Sem cart\u00e3o'}
                  periodicidadeLabel={getPeriodicidadeLabel(a)}
                  reajuste={reajusteMap.get(a.id)}
                  onEdit={setEditAssinatura}
                  onPauseResume={handlePauseResume}
                  onDelete={handleDelete}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Assinaturas Inativas / Pausadas */}
      {inativas.length > 0 && (
        <div>
          <h3 className="assinaturas-section__title">Inativas / Pausadas</h3>
          <div className="assinaturas-grid">
            {inativas.map((a) => {
              const catObj = categoryObjMap.get(a.categoriaId)
              return (
                <SubscriptionCard
                  key={a.id}
                  assinatura={a}
                  categoriaNome={catObj?.nome || 'Sem categoria'}
                  categoriaCor={catObj?.corHexadecimal}
                  categoriaIcone={catObj?.icone}
                  cartaoNome={cartaoMap.get(a.cartaoId) || 'Sem cart\u00e3o'}
                  periodicidadeLabel={getPeriodicidadeLabel(a)}
                  onEdit={setEditAssinatura}
                  onPauseResume={handlePauseResume}
                  onDelete={handleDelete}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Modais */}
      {showCreate && (
        <CreateSubscriptionModal
          cartoes={cartoes}
          categorias={categorias}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          onAddCategoryLocal={(novaCat) => {
            setCategorias((prev) => [...prev, novaCat])
          }}
        />
      )}

      {editAssinatura && (
        <EditSubscriptionModal
          assinatura={editAssinatura}
          cartoes={cartoes}
          categorias={categorias}
          onClose={() => setEditAssinatura(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
