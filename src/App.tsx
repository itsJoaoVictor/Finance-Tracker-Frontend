import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import './App.css'

import { Login } from './modules/auth/pages/Login'
import { Register } from './modules/auth/pages/Register'
import { EmConstrucao } from './modules/em-construcao/pages/EmConstrucao'
import { Perfil } from './modules/usuario/pages/Perfil'
import { Contas } from './modules/contas/pages/Contas'

import { useTheme } from './hooks/useTheme'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { useUsuario } from './modules/usuario/hooks/useUsuario'

// PrivateRoute to protect authenticated screens
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// PublicRoute to redirect authenticated users away from auth pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token')
  return token ? <Navigate to="/construction" replace /> : <>{children}</>
}

// ─── Shared layout helper ─────────────────────────────────────────────────────
function AppShell({
  pageTitle,
  activeItem,
  onSelectItem,
  children,
}: {
  pageTitle: string
  activeItem?: string
  onSelectItem?: (item: string) => void
  children: React.ReactNode
}) {
  const { user, loading } = useUsuario()
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="sidebar-layout">
      <Sidebar
        activeItem={activeItem}
        onSelectItem={onSelectItem}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          pageTitle={pageTitle}
          userName={loading ? 'Carregando...' : (user?.name || '')}
          userEmail={loading ? '...' : (user?.email || '')}
          onLogout={handleLogout}
        />
        <main
          className="sidebar-layout__content app__screen app__screen--enter"
          style={{ padding: '32px' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Dashboard Layout (sidebar-based navigation) ─────────────────────────────
function DashboardLayout() {
  const [activeItem, setActiveItem] = useState('dashboard')

  const itemLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    transacoes: 'Transações',
    contas: 'Contas',
    cartoes: 'Cartões',
    assinaturas: 'Assinaturas',
    categorias: 'Categorias',
    relatorios: 'Relatórios',
    configuracoes: 'Configurações',
  }

  return (
    <AppShell
      pageTitle={itemLabels[activeItem] || activeItem}
      activeItem={activeItem}
      onSelectItem={setActiveItem}
      key={activeItem}
    >
      {activeItem === 'contas' ? (
        <Contas />
      ) : (
        <EmConstrucao moduleName={itemLabels[activeItem] || activeItem} />
      )}
    </AppShell>
  )
}

// ─── Perfil Layout ────────────────────────────────────────────────────────────
function PerfilLayout() {
  return (
    <AppShell pageTitle="Meu Perfil">
      <Perfil />
    </AppShell>
  )
}

// ─── Contas Layout (rota própria /contas) ─────────────────────────────────────
function ContasLayout() {
  return (
    <AppShell pageTitle="Contas" activeItem="contas">
      <Contas />
    </AppShell>
  )
}

// ─── App Content (routing) ────────────────────────────────────────────────────
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  useTheme()

  // Inactivity auto-logout (15 minutes)
  useEffect(() => {
    const isAuthPage = ['/login', '/register'].includes(location.pathname)
    const token = sessionStorage.getItem('token')
    if (isAuthPage || !token) return

    let timeoutId: number

    const resetTimer = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        sessionStorage.removeItem('token')
        navigate('/login')
      }, 15 * 60 * 1000) // 15 minutes
    }

    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress']
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      window.clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [location.pathname, navigate])

  const handleNavigate = useCallback(
    (path: string) => {
      setIsTransitioning(true)
      window.setTimeout(() => {
        navigate(path)
        setIsTransitioning(false)
      }, 380)
    },
    [navigate],
  )

  const handleLoginSuccess = useCallback(() => {
    setIsTransitioning(true)
    window.setTimeout(() => {
      navigate('/construction')
      setIsTransitioning(false)
    }, 450)
  }, [navigate])

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div className={`app__screen ${isTransitioning ? 'app__screen--exit' : ''}`}>
                <Login
                  onLoginSuccess={handleLoginSuccess}
                  onNavigateRegister={() => handleNavigate('/register')}
                />
              </div>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <div className={`app__screen ${isTransitioning ? 'app__screen--exit' : ''}`}>
                <Register onNavigateLogin={() => handleNavigate('/login')} />
              </div>
            </PublicRoute>
          }
        />
        <Route
          path="/construction"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/contas"
          element={
            <PrivateRoute>
              <ContasLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <PerfilLayout />
            </PrivateRoute>
          }
        />
        {/* Fallback routing */}
        <Route
          path="*"
          element={
            sessionStorage.getItem('token') ? (
              <Navigate to="/construction" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
