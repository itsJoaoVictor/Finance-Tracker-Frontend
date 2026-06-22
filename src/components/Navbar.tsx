import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

interface NavbarProps {
  pageTitle: string
  userName?: string
  userEmail?: string
  userAvatar?: string
  onQuickAction?: () => void
  onLogout?: () => void
}

export function Navbar({
  pageTitle,
  userName = 'Alex Silva',
  userEmail = 'alex.silva@email.com',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  onQuickAction,
  onLogout
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const [timeLeft, setTimeLeft] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    if (!isDropdownOpen) return

    const updateTimer = () => {
      const expirationStr = sessionStorage.getItem('sessionExpiration')
      if (!expirationStr) {
        setTimeLeft('')
        return
      }

      const expiration = parseInt(expirationStr, 10)
      const now = Date.now()
      const diff = expiration - now

      if (diff <= 0) {
        setTimeLeft('Expirado')
        setIsUrgent(true)
        return
      }

      const totalSeconds = Math.floor(diff / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      const formatted = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':')

      setTimeLeft(formatted)
      setIsUrgent(totalSeconds <= 300) // 5 minutes
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [isDropdownOpen])

  const handleQuickAction = () => {
    if (onQuickAction) {
      onQuickAction()
    } else {
      alert('Nova Transação (Ação Rápida)')
    }
  }

  return (
    <header className="navbar">
      {/* Left side: Mobile Icon & Page Title */}
      <div className="navbar__left">
        <img
          src="/assets/images/favicon.ico"
          alt="Finance Tracker"
          className="navbar__mobile-logo"
        />
        <h2 className="navbar__title">{pageTitle}</h2>
      </div>

      {/* Right side: Quick Action button & Profile Menu */}
      <div className="navbar__right">
        <button className="navbar__action-btn" onClick={handleQuickAction}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nova Transação</span>
        </button>

        <div className="navbar__user-menu">
          <button
            className={`navbar__profile-trigger ${isDropdownOpen ? 'navbar__profile-trigger--open' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
          >
            <img
              src={userAvatar}
              alt={userName}
              className="navbar__avatar"
            />
            <span className="navbar__username">{userName}</span>
            <svg
              className="navbar__chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Click outside overlay handler */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 104,
                cursor: 'default'
              }}
              onClick={() => setIsDropdownOpen(false)}
            />
          )}

          {/* Dropdown Card */}
          {isDropdownOpen && (
            <div className="navbar__dropdown" role="menu">
              <div className="navbar__dropdown-header">
                <span className="navbar__username" style={{ display: 'block' }}>{userName}</span>
                <span className="navbar__dropdown-email">{userEmail}</span>
                {timeLeft && (
                  <div className={`navbar__dropdown-timer ${isUrgent ? 'navbar__dropdown-timer--urgent' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Sessão: {timeLeft}</span>
                  </div>
                )}
              </div>

              <button
                className="navbar__dropdown-item"
                role="menuitem"
                onClick={() => {
                  navigate('/perfil');
                  setIsDropdownOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu Perfil
              </button>

              <button
                className="navbar__dropdown-item"
                role="menuitem"
                onClick={() => {
                  alert('Acessar Configurações');
                  setIsDropdownOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Configurações
              </button>

              {onLogout && (
                <button
                  className="navbar__dropdown-item navbar__dropdown-item--logout"
                  role="menuitem"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
