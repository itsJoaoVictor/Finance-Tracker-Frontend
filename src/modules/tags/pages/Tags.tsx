import { useEffect, useState, useCallback } from 'react'
import { Tag, TagCriacaoRequest } from '../../../types'
import { tagService } from '../../../services/tagService'
import { CreateTagModal } from '../components/CreateTagModal'
import { Toast, useToast } from '../../../components/Toast'
import '../tags.css'

export function Tags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const { toasts, addToast, dismiss } = useToast()

  const loadTags = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tagService.getAll()
      setTags(res.data)
    } catch {
      addToast('Erro ao carregar tags.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  // ─── Criar Tag ─────────────────────────────────────────────────
  async function handleCreate(data: TagCriacaoRequest) {
    try {
      const res = await tagService.create(data)
      setTags((prev) => [...prev, res.data])
      setShowCreate(false)
      addToast('Tag criada com sucesso!', 'success')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const msg = axiosErr?.response?.data?.error || 'Erro ao criar tag.'
      addToast(msg, 'error')
      throw err
    }
  }

  return (
    <div className="tags-page">
      {/* Header */}
      <div className="tags-header">
        <button
          className="btn-nova-tag"
          onClick={() => setShowCreate(true)}
          id="btn-nova-tag"
        >
          + Nova Tag
        </button>
      </div>

      {/* Grid de Tags */}
      {loading && tags.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Carregando tags...
        </div>
      ) : tags.length === 0 ? (
        <div className="tags-empty">
          <p>Nenhuma tag cadastrada. Crie sua primeira tag!</p>
        </div>
      ) : (
        <div className="tags-grid">
          {tags.map((tag) => (
            <div key={tag.id} className="tag-card">
              <span
                className="tag-card__dot"
                style={{ backgroundColor: tag.corHexadecimal }}
              />
              <span className="tag-card__name">{tag.nome}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {showCreate && (
        <CreateTagModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Toast */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}