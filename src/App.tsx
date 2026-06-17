import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import { Login } from './modules/auth/pages/Login'
import { Register } from './modules/auth/pages/Register'
import { EmConstrucao } from './modules/em-construcao/pages/EmConstrucao'
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

function DashboardLayout() {
  const [activeItem, setActiveItem] = useState('dashboard')
  const { user, loading } = useUsuario()
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    navigate('/login')
  }

  const itemLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    transacoes: 'Transações',
    contas: 'Contas',
    cartoes: 'Cartões',
    assinaturas: 'Assinaturas',
    categorias: 'Categorias',
    relatorios: 'Relatórios',
    configuracoes: 'Configurações'
  }

  return (
    <div className="sidebar-layout">
      <Sidebar
        activeItem={activeItem}
        onSelectItem={setActiveItem}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          pageTitle={itemLabels[activeItem] || activeItem}
          userName={loading ? 'Carregando...' : (user?.name || '')}
          userEmail={loading ? '...' : (user?.email || '')}
          onLogout={handleLogout}
        />
        <main className="sidebar-layout__content app__screen app__screen--enter" key={activeItem} style={{ padding: '32px' }}>
          <EmConstrucao moduleName={itemLabels[activeItem] || activeItem} />
        </main>
      </div>
    </div>
  )
}

import { Perfil } from './modules/usuario/pages/Perfil'

function PerfilLayout() {
  const { user, loading } = useUsuario()
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="sidebar-layout">
      <Sidebar
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          pageTitle="Meu Perfil"
          userName={loading ? 'Carregando...' : (user?.name || '')}
          userEmail={loading ? '...' : (user?.email || '')}
          onLogout={handleLogout}
        />
        <main className="sidebar-layout__content app__screen app__screen--enter" style={{ padding: '32px' }}>
          <Perfil />
        </main>
      </div>
    </div>
  )
}

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
    events.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      window.clearTimeout(timeoutId)
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [location.pathname, navigate])

  const handleNavigate = useCallback((path: string) => {
    setIsTransitioning(true)
    window.setTimeout(() => {
      navigate(path)
      setIsTransitioning(false)
    }, 380)
  }, [navigate])

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
