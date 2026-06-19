import { useState, useRef, useEffect } from 'react'
import { Categoria } from '../types'
import { CategoryIcon } from './CategoryIcon'

interface CategorySelectProps {
  value: string
  onChange: (id: string) => void
  categorias: Categoria[]
  error?: string
}

export function CategorySelect({ value, onChange, categorias, error }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Encontra a categoria atualmente selecionada
  const selectedCategory = categorias.find((c) => c.id === value)

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Agrupa as categorias em Globais (usuarioId === null) e Customizadas
  const globalCategories = categorias.filter((c) => c.usuarioId === null && c.ativo)
  const customCategories = categorias.filter((c) => c.usuarioId !== null && c.ativo)

  return (
    <div ref={containerRef} className="form-group" style={{ position: 'relative' }}>
      <label>Categoria</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={error ? 'error' : ''}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 14px',
          border: error ? '1px solid var(--danger, #e63946)' : '1px solid var(--border, #e0e0e0)',
          borderRadius: '8px',
          background: 'var(--card, #ffffff)',
          color: selectedCategory ? 'var(--ink, #1c1a17)' : 'var(--muted, #828282)',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.95rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {selectedCategory ? (
            <>
              <CategoryIcon
                name={selectedCategory.icone}
                color={selectedCategory.corHexadecimal}
                size={18}
              />
              <span>{selectedCategory.nome}</span>
            </>
          ) : (
            <span>Selecione uma categoria...</span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {error && <p className="form-error" style={{ color: 'var(--danger, #e63946)', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>}

      {isOpen && (
        <div
          className="category-dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 999,
            marginTop: 6,
            background: 'var(--card, #ffffff)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px 0',
          }}
        >
          {customCategories.length > 0 && (
            <div>
              <div style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Minhas Categorias
              </div>
              {customCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id)
                    setIsOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: value === c.id ? 'var(--bg-hover, #f5f5f5)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--ink, #1c1a17)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f5f5f5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = value === c.id ? 'var(--bg-hover, #f5f5f5)' : 'transparent')}
                >
                  <CategoryIcon name={c.icone} color={c.corHexadecimal} size={16} />
                  <span style={{ fontSize: '0.9rem' }}>{c.nome}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <div style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: customCategories.length > 0 ? 6 : 0 }}>
              Categorias Padrão
            </div>
            {globalCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id)
                  setIsOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  background: value === c.id ? 'var(--bg-hover, #f5f5f5)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--ink, #1c1a17)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f5f5f5)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = value === c.id ? 'var(--bg-hover, #f5f5f5)' : 'transparent')}
              >
                <CategoryIcon name={c.icone} color={c.corHexadecimal} size={16} />
                <span style={{ fontSize: '0.9rem' }}>{c.nome}</span>
              </button>
            ))}
          </div>

          {categorias.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
              Nenhuma categoria disponível
            </div>
          )}
        </div>
      )}
    </div>
  )
}
