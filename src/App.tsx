import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import './App.css'

import { Login } from './modules/auth/pages/Login'
import { Register } from './modules/auth/pages/Register'

import { Perfil } from './modules/usuario/pages/Perfil'
import { Contas } from './modules/contas/pages/Contas'
import { Cartoes } from './modules/cartoes/pages/Cartoes'
import { Categorias } from './modules/categorias/pages/Categorias'
import { Transacoes } from './modules/transacoes/pages/Transacoes'
import { Tags } from './modules/tags/pages/Tags'
import { Assinaturas } from './modules/assinaturas/pages/Assinaturas'
import { Metas } from './modules/metas/pages/Metas'
import { Orcamentos } from './modules/orcamentos/pages/Orcamentos'
import { Dashboard } from './modules/dashboard/Dashboard'
import { Relatorios } from './modules/relatorios/Relatorios'

import { useTheme } from './hooks/useTheme'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { useUsuario } from './modules/usuario/hooks/useUsuario'
import { SessionRenewalModal } from './components/SessionRenewalModal'

// PrivateRoute to protect authenticated screens
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// PublicRoute to redirect authenticated users away from auth pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('token')
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
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
    sessionStorage.removeItem('sessionExpiration')
    navigate('/login')
  }

  const handleSelectItem = (item: string) => {
    if (onSelectItem) {
      onSelectItem(item)
    } else {
      if (item === 'dashboard') {
        navigate('/dashboard')
      } else if (item === 'contas') {
        navigate('/contas')
      } else if (item === 'cartoes') {
        navigate('/cartoes')
      } else if (item === 'categorias') {
        navigate('/categorias')
      } else if (item === 'transacoes') {
        navigate('/transacoes')
      } else if (item === 'assinaturas') {
        navigate('/assinaturas')
      } else if (item === 'tags') {
        navigate('/tags')
      } else if (item === 'metas' || item === 'cofrinhos') {
        navigate('/metas')
      } else if (item === 'orcamentos') {
        navigate('/orcamentos')
      } else if (item === 'relatorios') {
        navigate('/relatorios')
      } else {
        navigate('/construction', { state: { activeItem: item } })
      }
    }
  }

  return (
    <div className="sidebar-layout">
      <Sidebar
        activeItem={activeItem}
        onSelectItem={handleSelectItem}
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
          key={pageTitle}
          className="sidebar-layout__content app__screen app__screen--enter"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Dashboard Layout (sidebar-based navigation) ─────────────────────────────
function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeItem, setActiveItem] = useState(() => {
    return (location.state as any)?.activeItem || 'dashboard'
  })

  useEffect(() => {
    if (location.state && (location.state as any).activeItem) {
      setActiveItem((location.state as any).activeItem)
    }
  }, [location.state])

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

  const handleSelectItem = (item: string) => {
    if (item === 'contas') {
      navigate('/contas')
    } else if (item === 'cartoes') {
      navigate('/cartoes')
    } else if (item === 'categorias') {
      navigate('/categorias')
    } else if (item === 'transacoes') {
      navigate('/transacoes')
    } else if (item === 'assinaturas') {
      navigate('/assinaturas')
    } else if (item === 'tags') {
      navigate('/tags')
    } else if (item === 'metas' || item === 'cofrinhos') {
      navigate('/metas')
    } else if (item === 'orcamentos') {
      navigate('/orcamentos')
    } else if (item === 'relatorios') {
      navigate('/relatorios')
    } else {
      setActiveItem(item)
      navigate('/construction', { state: { activeItem: item }, replace: true })
    }
  }

  return (
    <AppShell
      pageTitle={itemLabels[activeItem] || activeItem}
      activeItem={activeItem}
      onSelectItem={handleSelectItem}
    >
      <Dashboard />
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

// ─── Cartões Layout (rota própria /cartoes) ───────────────────────────────────
function CartoesLayout() {
  return (
    <AppShell pageTitle="Cartões" activeItem="cartoes">
      <Cartoes />
    </AppShell>
  )
}

// ─── Categorias Layout (rota própria /categorias) ─────────────────────────────
function CategoriasLayout() {
  return (
    <AppShell pageTitle="Categorias" activeItem="categorias">
      <Categorias />
    </AppShell>
  )
}

// ─── Transações Layout ────────────────────────────────────────────────────────
function TransacoesLayout() {
  return (
    <AppShell pageTitle="Transações" activeItem="transacoes">
      <Transacoes />
    </AppShell>
  )
}

// ─── Assinaturas Layout ───────────────────────────────────────────────────────
function AssinaturasLayout() {
  return (
    <AppShell pageTitle="Assinaturas" activeItem="assinaturas">
      <Assinaturas />
    </AppShell>
  )
}

// ─── Tags Layout ──────────────────────────────────────────────────────────────
function TagsLayout() {
  return (
    <AppShell pageTitle="Tags" activeItem="tags">
      <Tags />
    </AppShell>
  )
}

// ─── Metas (Cofrinhos) Layout ─────────────────────────────────────────────────
function MetasLayout() {
  return (
    <AppShell pageTitle="Cofrinhos" activeItem="metas">
      <Metas />
    </AppShell>
  )
}

// ─── Orçamentos Layout ────────────────────────────────────────────────────────
function OrcamentosLayout() {
  return (
    <AppShell pageTitle="Orçamentos" activeItem="orcamentos">
      <Orcamentos />
    </AppShell>
  )
}

// ─── Relatórios Layout ─────────────────────────────────────────────────────────
function RelatoriosLayout() {
  return (
    <AppShell pageTitle="Relatórios" activeItem="relatorios">
      <Relatorios />
    </AppShell>
  )
}

function decodeToken(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return { exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60 }
  }
}
// ─── App Content (routing) ────────────────────────────────────────────────────
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  useTheme()

  const [sessionExpiration, setSessionExpiration] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('sessionExpiration')
    if (stored) return parseInt(stored, 10)
    const token = sessionStorage.getItem('token')
    if (token) {
      try {
        const decoded = decodeToken(token)
        return decoded.exp * 1000
      } catch (e) {
        return null
      }
    }
    return null
  })

  const [showSessionModal, setShowSessionModal] = useState(false)

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('sessionExpiration')
    setSessionExpiration(null)
    setShowSessionModal(false)
    navigate('/login')
  }, [navigate])

  const handleRenewSession = useCallback((newToken: string) => {
    sessionStorage.setItem('token', newToken)
    try {
      const decoded = decodeToken(newToken)
      const newExpiration = decoded.exp * 1000
      setSessionExpiration(newExpiration)
      sessionStorage.setItem('sessionExpiration', newExpiration.toString())
    } catch (e) {
      const newExpiration = Date.now() + 2 * 60 * 60 * 1000
      setSessionExpiration(newExpiration)
      sessionStorage.setItem('sessionExpiration', newExpiration.toString())
    }
    setShowSessionModal(false)
  }, [])

  // Session duration timer & countdown manager
  useEffect(() => {
    const isAuthPage = ['/login', '/register'].includes(location.pathname)
    const token = sessionStorage.getItem('token')

    if (isAuthPage || !token) {
      setShowSessionModal(false)
      return
    }

    // Set or load sessionExpiration
    let expirationTime = sessionExpiration
    if (!expirationTime) {
      try {
        const decoded = decodeToken(token)
        expirationTime = decoded.exp * 1000
        setSessionExpiration(expirationTime)
        sessionStorage.setItem('sessionExpiration', expirationTime.toString())
      } catch (e) {
        expirationTime = Date.now() + 2 * 60 * 60 * 1000
        setSessionExpiration(expirationTime)
        sessionStorage.setItem('sessionExpiration', expirationTime.toString())
      }
    }

    const checkTimer = () => {
      const now = Date.now()
      const diff = expirationTime! - now

      if (diff <= 0) {
        handleLogout()
        return
      }

      // Show renewal modal if remaining time is <= 5 minutes (300,000 ms)
      if (diff <= 5 * 60 * 1000) {
        setShowSessionModal(true)
      } else {
        setShowSessionModal(false)
      }
    }

    checkTimer()
    const intervalId = window.setInterval(checkTimer, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [location.pathname, sessionExpiration, handleLogout])

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
      navigate('/dashboard')
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
          path="/cartoes"
          element={
            <PrivateRoute>
              <CartoesLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/categorias"
          element={
            <PrivateRoute>
              <CategoriasLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/transacoes"
          element={
            <PrivateRoute>
              <TransacoesLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/assinaturas"
          element={
            <PrivateRoute>
              <AssinaturasLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/tags"
          element={
            <PrivateRoute>
              <TagsLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/metas"
          element={
            <PrivateRoute>
              <MetasLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/orcamentos"
          element={
            <PrivateRoute>
              <OrcamentosLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <RelatoriosLayout />
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
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      {showSessionModal && (
        <SessionRenewalModal
          onRenew={handleRenewSession}
          onLogout={handleLogout}
          expirationTime={sessionExpiration}
        />
      )}
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
