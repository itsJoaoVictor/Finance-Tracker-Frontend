import { useEffect, useState, useCallback } from 'react'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastSingle key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastSingle({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className={`toast toast--${toast.type}`} onClick={() => onDismiss(toast.id)}>
      <span className="toast__icon">{toast.type === 'success' ? '✓' : '✕'}</span>
      <span>{toast.message}</span>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, dismiss }
}
