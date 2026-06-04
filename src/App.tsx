import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import './App.css'
import { Login } from './modules/auth/pages/Login'
import { Register } from './modules/auth/pages/Register'
import { EmConstrucao } from './modules/em-construcao/pages/EmConstrucao'

// PrivateRoute to protect authenticated screens
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// PublicRoute to redirect authenticated users away from auth pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <Navigate to="/construction" replace /> : <>{children}</>
}

function AppContent() {
  const navigate = useNavigate()
  const [isTransitioning, setIsTransitioning] = useState(false)

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
              <div className="app__screen app__screen--enter">
                <EmConstrucao moduleName="Despesas" />
              </div>
            </PrivateRoute>
          }
        />
        {/* Fallback routing */}
        <Route
          path="*"
          element={
            localStorage.getItem('token') ? (
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
