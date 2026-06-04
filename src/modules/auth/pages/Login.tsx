import { useMemo, useState } from 'react'
import type React from 'react'
import axios from 'axios'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { authService } from '../../../services/api'
import '../components/fields.css'
import './Login.css'

type LoginProps = {
  onLoginSuccess: () => void
  onNavigateRegister: () => void
}

const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email)

export function Login({ onLoginSuccess, onNavigateRegister }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [authError, setAuthError] = useState('')

  const emailError = useMemo(() => {
    if (!email) return 'Informe seu e-mail.'
    if (!isEmailValid(email)) return 'Use um e-mail valido.'
    return ''
  }, [email])

  const passwordError = useMemo(() => {
    if (!password.trim()) return 'A senha nao pode estar vazia.'
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
      localStorage.setItem('token', response.data.token)
      onLoginSuccess()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setAuthError('E-mail ou senha incorretos. Tente novamente.')
        } else {
          setAuthError('Nao foi possivel conectar ao servidor. Tente novamente.')
        }
      } else {
        setAuthError('E-mail ou senha incorretos. Tente novamente.')
      }
    }
  }

  return (
    <div className="login">
      <div className="login__shell">
        <div className="login__panel login__panel--form">
          <img
            src="/assets/images/Logo.png"
            alt="Finance Tracker"
            className="login__logo"
          />
          <div className="login__headline">
            <p className="login__eyebrow">Bem-vindo</p>
            <h1 className="login__title">Entre para acompanhar suas financas.</h1>
            <p className="login__subtitle">
              Uma experiencia simples para organizar despesas e manter o controle do seu dinheiro.
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
              <a className="login__link" href="#" onClick={(event) => event.preventDefault()}>
                Esqueci minha senha
              </a>
            </div>

            {authError ? (
              <div className="login__auth-error" role="alert" aria-live="polite">
                {authError}
              </div>
            ) : null}

            <button className="login__submit" type="submit" disabled={!isFormValid}>
              Entrar
            </button>
          </form>

          <p className="login__footnote">
            Ainda nao tem conta?{' '}
            <button
              className="login__link-button"
              type="button"
              onClick={onNavigateRegister}
            >
              Crie a sua agora
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}
