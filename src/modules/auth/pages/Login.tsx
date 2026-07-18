import { useMemo, useState, useEffect } from 'react'
import type React from 'react'
import axios from 'axios'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { authService } from '../../../services/api'
import { useTheme } from '../../../hooks/useTheme'
import '../components/fields.css'
import './Login.css'

type LoginProps = {
  onLoginSuccess: () => void
  onNavigateRegister: () => void
}

const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email)

export function Login({ onLoginSuccess, onNavigateRegister }: LoginProps) {
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [authError, setAuthError] = useState('')
  const [serverStatus, setServerStatus] = useState<'connecting' | 'online'>('connecting')

  // Acorda o servidor do Render o mais cedo possível
  useEffect(() => {
    // Faz uma requisição invisível apenas para tirar o servidor da inatividade
    // @ts-ignore
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    fetch(backendUrl)
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('online')) // Se respondeu com erro (ex: CORS ou 404), significa que já acordou!
  }, [])

  // MFA state
  const [showMfa, setShowMfa] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')

  // Expired password state
  const [showExpiredReset, setShowExpiredReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('')
  const [resetError, setResetError] = useState('')

  const emailError = useMemo(() => {
    if (!email) return 'Informe seu e-mail.'
    if (!isEmailValid(email)) return 'Use um e-mail válido.'
    return ''
  }, [email])

  const passwordError = useMemo(() => {
    if (!password.trim()) return 'A senha não pode estar vazia.'
    return ''
  }, [password])

  const showEmailError = (touched.email || hasSubmitted) && emailError
  const showPasswordError = (touched.password || hasSubmitted) && passwordError
  const isFormValid = !emailError && !passwordError

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)
    setAuthError('')

    if (!isFormValid) return

    try {
      const response = await authService.login({ email, password })
      if (response.status === 202 && response.data.twoFactorRequired) {
        setShowMfa(true)
        return
      }

      const token = response.data.token || response.data.access_token
      if (token) {
        sessionStorage.setItem('token', token)
        onLoginSuccess()
      } else {
        setAuthError('Resposta inválida do servidor.')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.message || ''

        if (status === 401) {
          setAuthError('E-mail ou senha incorretos. Tente novamente.')
        } else if (status === 429) {
          setAuthError('Muitas tentativas de login consecutivas. Por favor, tente novamente mais tarde.')
        } else if (status === 403) {
          const lowerMsg = message.toLowerCase();
          if (lowerMsg.includes('inativa') || lowerMsg.includes('inactive')) {
            setAuthError('Esta conta está inativa. Entre em contato com o suporte.')
          } else if (lowerMsg.includes('verificada') || lowerMsg.includes('not verified')) {
            setAuthError('Esta conta ainda não foi verificada. Verifique seu e-mail.')
          } else if (lowerMsg.includes('bloqueada') || lowerMsg.includes('blocked')) {
            setAuthError('Esta conta foi bloqueada por um administrador.')
          } else if (lowerMsg.includes('expirada') || lowerMsg.includes('expired')) {
            setShowExpiredReset(true)
          } else {
            setAuthError('Acesso negado. Por favor, verifique as condições da sua conta.')
          }
        } else {
          setAuthError('Não foi possível conectar ao servidor. Tente novamente.')
        }
      } else {
        setAuthError('E-mail ou senha incorretos. Tente novamente.')
      }
    }
  }

  const handleMfaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!mfaCode.trim()) return

    try {
      if (mfaCode.trim().length === 6) {
        sessionStorage.setItem('token', 'mocked_jwt_token_from_mfa')
        onLoginSuccess()
      } else {
        setMfaError('Código inválido. Digite um código de 6 dígitos.')
      }
    } catch (err) {
      setMfaError('Erro na verificação do 2FA. Tente novamente.')
    }
  }

  const handlePasswordResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNewPasswordError('')
    setConfirmNewPasswordError('')
    setResetError('')

    if (newPassword.length < 8) {
      setNewPasswordError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError('As senhas não coincidem.')
      return
    }

    try {
      sessionStorage.setItem('token', 'mocked_jwt_token_after_password_reset')
      onLoginSuccess()
    } catch (err) {
      setResetError('Não foi possível alterar a senha. Tente novamente.')
    }
  }

  if (showMfa) {
    return (
      <div className="login">
        <button
          className="auth__theme-toggle"
          onClick={toggleTheme}
          type="button"
          aria-label={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        </button>
        <div className="login__shell">
          <div className="login__panel login__panel--form">
            <img
              src="/assets/images/Logo.png"
              alt="Finance Tracker"
              className="login__logo"
            />
            <div className="login__headline">
              <p className="login__eyebrow">Autenticação</p>
              <h1 className="login__title">Verificação de Duas Etapas (2FA)</h1>
              <p className="login__subtitle">
                Insira o código temporário gerado no seu aplicativo de autenticação.
              </p>
            </div>

            <form className="login__form" onSubmit={handleMfaSubmit} noValidate>
              <TextField
                id="mfaCode"
                label="Código de Autenticação"
                type="text"
                value={mfaCode}
                placeholder="000 000"
                autoComplete="one-time-code"
                inputMode="numeric"
                error={mfaError}
                onChange={(event) => {
                  setMfaCode(event.target.value)
                  setMfaError('')
                }}
              />

              <button className="login__submit" type="submit" disabled={!mfaCode.trim()}>
                Confirmar Código
              </button>
            </form>

            <p className="login__footnote">
              <button
                className="login__link-button"
                type="button"
                onClick={() => {
                  setShowMfa(false)
                  setMfaCode('')
                  setMfaError('')
                }}
              >
                Voltar para o login
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showExpiredReset) {
    return (
      <div className="login">
        <button
          className="auth__theme-toggle"
          onClick={toggleTheme}
          type="button"
          aria-label={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        </button>
        <div className="login__shell">
          <div className="login__panel login__panel--form">
            <img
              src="/assets/images/Logo.png"
              alt="Finance Tracker"
              className="login__logo"
            />
            <div className="login__headline">
              <p className="login__eyebrow">Segurança</p>
              <h1 className="login__title">Sua senha expirou</h1>
              <p className="login__subtitle">
                Por favor, cadastre uma nova senha para continuar acessando sua conta.
              </p>
            </div>

            <form className="login__form" onSubmit={handlePasswordResetSubmit} noValidate>
              <PasswordField
                id="newPassword"
                label="Nova Senha"
                value={newPassword}
                placeholder="Nova senha forte"
                error={newPasswordError}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  setNewPasswordError('')
                }}
              />

              <PasswordField
                id="confirmNewPassword"
                label="Confirmar Nova Senha"
                value={confirmNewPassword}
                placeholder="Repita a nova senha"
                error={confirmNewPasswordError}
                onChange={(event) => {
                  setConfirmNewPassword(event.target.value)
                  setConfirmNewPasswordError('')
                }}
              />

              {resetError ? (
                <div className="login__auth-error" role="alert">
                  {resetError}
                </div>
              ) : null}

              <button className="login__submit" type="submit" disabled={!newPassword || !confirmNewPassword}>
                Alterar Senha e Entrar
              </button>
            </form>

            <p className="login__footnote">
              <button
                className="login__link-button"
                type="button"
                onClick={() => {
                  setShowExpiredReset(false)
                  setNewPassword('')
                  setConfirmNewPassword('')
                  setResetError('')
                }}
              >
                Voltar para o login
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login">
      <button
        className="auth__theme-toggle"
        onClick={toggleTheme}
        type="button"
        aria-label={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
      >
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      </button>
      <div className="login__shell">
        <div className="login__panel login__panel--form">
          <img
            src="/assets/images/Logo.png"
            alt="Finance Tracker"
            className="login__logo"
          />
          <div className="login__headline">
            <p className="login__eyebrow">Bem-vindo</p>
            <h1 className="login__title">Entre para acompanhar suas finanças.</h1>
            <p className="login__subtitle">
              Uma experiência simples para organizar despesas e manter o controle do seu dinheiro.
            </p>
          </div>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <TextField
              id="email"
              label="E-mail"
              type="email"
              value={email}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              inputMode="email"
              error={showEmailError ? emailError : ''}
              onChange={(event) => {
                setEmail(event.target.value)
                setAuthError('')
              }}
              onBlur={(_event) => setTouched((current) => ({ ...current, email: true }))}
            />

            <PasswordField
              id="password"
              label="Senha"
              value={password}
              placeholder="Sua senha"
              autoComplete="current-password"
              error={showPasswordError ? passwordError : ''}
              onChange={(event) => {
                setPassword(event.target.value)
                setAuthError('')
              }}
              onBlur={(_event) => setTouched((current) => ({ ...current, password: true }))}
            />

            <div className="login__row">
              <a className="login__link" href="#" onClick={(event) => {
                event.preventDefault();
                alert('Funcionalidade de recuperação de senha em breve.');
              }}>
                Esqueci minha senha
              </a>
            </div>

            {authError ? (
              <div className="login__auth-error" role="alert" aria-live="polite">
                {authError}
              </div>
            ) : null}

            <button 
              className="login__submit" 
              type="submit" 
              disabled={!isFormValid || serverStatus === 'connecting'}
            >
              {serverStatus === 'connecting' ? 'Iniciando servidor...' : 'Entrar'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '1.5rem' }}>
            <p className="login__footnote" style={{ margin: 0 }}>
              Ainda não tem conta?{' '}
              <button
                className="login__link-button"
                type="button"
                onClick={onNavigateRegister}
              >
                Crie a sua agora
              </button>
            </p>
            
            <p className="login__footnote" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: serverStatus === 'connecting' ? '#f5a623' : '#10b981',
                animation: serverStatus === 'connecting' ? 'pulse 1.5s infinite' : 'none'
              }} />
              Status: {serverStatus === 'connecting' ? 'Conectando à Nuvem...' : 'Online'}
            </p>
          </div>
        </div>
      </div>
      {/* Add a quick keyframe for the pulse animation if not exists */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
