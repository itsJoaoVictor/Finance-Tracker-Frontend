import React from 'react'

interface FormModalProps {
  titulo: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  children: React.ReactNode
}

export function FormModal({
  titulo,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  children,
}: FormModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">{titulo}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar" disabled={isLoading}>
            ✕
          </button>
        </div>
        <form className="modal__form" onSubmit={onSubmit} noValidate>
          {children}
        </form>
      </div>
    </div>
  )
}
