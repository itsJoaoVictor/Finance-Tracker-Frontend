import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import './Sidebar.css'

export interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  activeItem?: string
  onSelectItem?: (itemId: string) => void
  onLogout?: () => void
}

export function Sidebar({ activeItem, onSelectItem, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const items: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      id: 'transacoes',
      label: 'Transações',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      )
    },
    {
      id: 'contas',
      label: 'Contas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M19 21v-4" />
          <path d="M5 21v-4" />
          <path d="M10 21v-4" />
          <path d="M14 21v-4" />
          <path d="M4 17h16" />
          <path d="M12 3L3 9h18z" />
        </svg>
      )
    },
    {
      id: 'cartoes',
      label: 'Cartões',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    },
    {
      id: 'assinaturas',
      label: 'Assinaturas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 'categorias',
      label: 'Categorias',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      )
    },
    {
      id: 'metas',
      label: 'Cofrinhos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
          <path d="M2 9.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V12" />
          <path d="M16 11h.01" />
        </svg>
      )
    },
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      )
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ]

  const handleSelect = (itemId: string) => {
    if (onSelectItem) {
      onSelectItem(itemId)
    }
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Hamburger Menu Trigger for Mobile */}
      <button
        className="mobile-trigger"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isMobileOpen ? (
            <line x1="18" y1="6" x2="6" y2="18" />
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop overlay for mobile drawer */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'sidebar-backdrop--open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* The Sidebar panel */}
      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${isMobileOpen ? 'sidebar--open' : ''}`}>
        {/* Floating Toggle Button (Desktop only) */}
        <button
          className="sidebar__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={isCollapsed ? 'Expandir' : 'Recolher'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="sidebar__header">
          <div className="sidebar__brand">
            {isCollapsed ? (
              <img
                src="/assets/images/favicon.ico"
                alt="Finance Tracker Icon"
                className="sidebar__logo-icon"
              />
            ) : (
              <img
                src="/assets/images/Logo.png"
                alt="Finance Tracker Logo"
                className="sidebar__logo-full"
              />
            )}
          </div>
        </div>

        <nav className="sidebar__nav-wrapper">
          <ul className="sidebar__nav">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  className={`sidebar__item ${activeItem === item.id ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleSelect(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="sidebar__item-icon">{item.icon}</span>
                  <span className="sidebar__item-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          {/* Theme Toggle Button */}
          <button
            className="sidebar__item sidebar__item--theme"
            onClick={toggleTheme}
            title={isCollapsed ? (theme === 'light' ? 'Modo Escuro' : 'Modo Claro') : undefined}
          >
            <span className="sidebar__item-icon">
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </span>
            <span className="sidebar__item-label">
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          </button>

          {onLogout && (
            <button
              className="sidebar__item sidebar__item--logout"
              onClick={onLogout}
              title={isCollapsed ? 'Sair da conta' : undefined}
              style={{ marginTop: '8px' }}
            >
              <span className="sidebar__item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="sidebar__item-label">Sair da conta</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
