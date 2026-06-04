import { useCallback, useState } from 'react'
import './App.css'
import { Login } from './modules/auth/pages/Login'
import { Register } from './modules/auth/pages/Register'
import { EmConstrucao } from './modules/em-construcao/pages/EmConstrucao'

type Screen = 'login' | 'register' | 'construction'

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNavigate = useCallback((nextScreen: Screen) => {
    if (nextScreen === screen) return
    setIsTransitioning(true)

    window.setTimeout(() => {
      setScreen(nextScreen)
      setIsTransitioning(false)
    }, 380)
  }, [screen])

  const handleLoginSuccess = useCallback(() => {
    setIsTransitioning(true)

    window.setTimeout(() => {
      setScreen('construction')
      setIsTransitioning(false)
    }, 450)
  }, [])

  return (
    <div className="app">
      {screen === 'login' ? (
        <div className={`app__screen ${isTransitioning ? 'app__screen--exit' : ''}`}>
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => handleNavigate('register')}
          />
        </div>
      ) : null}

      {screen === 'register' ? (
        <div className={`app__screen ${isTransitioning ? 'app__screen--exit' : ''}`}>
          <Register onNavigateLogin={() => handleNavigate('login')} />
        </div>
      ) : null}

      {screen === 'construction' ? (
        <div className="app__screen app__screen--enter">
          <EmConstrucao moduleName="Despesas" />
        </div>
      ) : null}
    </div>
  )
}

export default App
