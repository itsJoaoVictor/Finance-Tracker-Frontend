import React, { useEffect } from 'react'

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
  children
}: FormModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2
            className="modal__title"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
          >
            {titulo}
          </h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
            disabled={isLoading}
          >
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
