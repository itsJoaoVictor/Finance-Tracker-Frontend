import React, { useState, useEffect } from 'react'
import { authService } from '../services/api'
import { ShieldAlert, Eye, EyeOff, Lock, LogOut } from 'lucide-react'
import './SessionRenewalModal.css'

interface SessionRenewalModalProps {
  onRenew: (newToken: string) => void
  onLogout: () => void
  expirationTime: number | null
}

export function SessionRenewalModal({
  onRenew,
  onLogout,
  expirationTime,
}: SessionRenewalModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeftStr, setTimeLeftStr] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    if (!expirationTime) return

    const updateCountdown = () => {
      const now = Date.now()
      const diff = expirationTime - now

      if (diff <= 0) {
        onLogout()
        return
      }

      const totalSeconds = Math.floor(diff / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60

      const formatted = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`

      setTimeLeftStr(formatted)
      setIsUrgent(totalSeconds <= 60) // Pulse red in the final minute
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [expirationTime, onLogout])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Por favor, digite sua senha.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await authService.extendSession(password)
      const token = response.data.token || response.data.access_token
      if (token) {
        onRenew(token)
        setPassword('')
      } else {
        setError('Erro ao estender sessão. Tente novamente.')
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Senha incorreta. Tente novamente.')
      } else {
        setError('Erro de conexão. Tente novamente mais tarde.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="session-modal-overlay">
      <div className="session-modal">
        <div className="session-modal__icon">
          <ShieldAlert size={28} />
        </div>
        <h3 className="session-modal__title">Sua sessão vai expirar</h3>
        <p className="session-modal__message">
          Por motivos de segurança, sua sessão será encerrada automaticamente. Insira sua senha para continuar conectado.
        </p>

        <div className={`session-modal__timer ${isUrgent ? 'session-modal__timer--urgent' : ''}`}>
          {timeLeftStr}
        </div>

        <form onSubmit={handleSubmit} className="session-modal__form">
          <div className="session-modal__input-wrapper">
            <span className="session-modal__input-icon">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              className="session-modal__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              className="session-modal__toggle-pwd"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div className="session-modal__error">{error}</div>}

          <div className="session-modal__actions">
            <button
              type="button"
              className="session-modal__btn session-modal__btn--secondary"
              onClick={onLogout}
              disabled={isLoading}
            >
              <LogOut size={16} style={{ marginRight: '6px' }} />
              Sair
            </button>
            <button
              type="submit"
              className="session-modal__btn session-modal__btn--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Permanecer Conectado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
