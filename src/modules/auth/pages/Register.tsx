import { useMemo, useState } from 'react'
import type React from 'react'
import axios from 'axios'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { authService } from '../../../services/api'
import { useTheme } from '../../../hooks/useTheme'
import '../components/fields.css'
import './Register.css'

type RegisterProps = {
  onNavigateLogin: () => void
}

const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getPasswordChecks = (password: string) => {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  }
}

export function Register({ onNavigateLogin }: RegisterProps) {
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false })
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password])
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean)

  const nameError = useMemo(() => {
    if (!name) return 'Informe seu nome.'
    if (name.trim().length < 3) return 'O nome deve ter pelo menos 3 caracteres.'
    return ''
  }, [name])

  const emailError = useMemo(() => {
    if (!email) return 'Informe seu e-mail.'
    if (!isEmailValid(email)) return 'Use um e-mail valido.'
    return ''
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) return 'Informe sua senha.'
    if (!isPasswordStrong) return 'A senha precisa atender aos requisitos abaixo.'
    return ''
  }, [password, isPasswordStrong])

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return 'Confirme sua senha.'
    if (confirmPassword !== password) return 'As senhas nao coincidem.'
    return ''
  }, [confirmPassword, password])

  const showNameError = (touched.name || hasSubmitted) && nameError
  const showEmailError = (touched.email || hasSubmitted) && emailError
  const showPasswordError = (touched.password || hasSubmitted) && passwordError
  const showConfirmError = (touched.confirmPassword || hasSubmitted) && confirmPasswordError

  const isFormValid = !nameError && !emailError && !passwordError && !confirmPasswordError

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)
    setSubmitError('')
    setSubmitSuccess('')

    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      await authService.register({ name, email, password, confirmPassword })
      setSubmitSuccess('Cadastro realizado. Agora voce pode entrar.')
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setTouched({ name: false, email: false, password: false, confirmPassword: false })
      setTimeout(() => {
        onNavigateLogin()
      }, 2000)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 409) {
          setSubmitError('Este e-mail ou nome ja esta cadastrado.')
        } else if (status === 400) {
          setSubmitError('Revise os dados e tente novamente.')
        } else {
          setSubmitError('Nao foi possivel criar a conta agora.')
        }
      } else {
        setSubmitError('Nao foi possivel criar a conta agora.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register">
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
      <div className="register__shell">
        <div className="register__panel register__panel--form">
          <img
            src="/assets/images/Logo.png"
            alt="Finance Tracker"
            className="register__logo"
          />
          <div className="register__headline">
            <p className="register__eyebrow">Crie sua conta</p>
            <h1 className="register__title">Tudo pronto para organizar suas financas.</h1>
            <p className="register__subtitle">
              Cadastre-se para acompanhar despesas, metas e evolucao em um so lugar.
            </p>
          </div>

          <form className="register__form" onSubmit={handleSubmit} noValidate>
            <TextField
              id="register-name"
              label="Nome"
              type="text"
              value={name}
              placeholder="Seu nome"
              autoComplete="name"
              error={showNameError ? nameError : ''}
              onChange={(event) => setName(event.target.value)}
              onBlur={(_event) => setTouched((current) => ({ ...current, name: true }))}
            />

            <TextField
              id="register-email"
              label="E-mail"
              type="email"
              value={email}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              inputMode="email"
              error={showEmailError ? emailError : ''}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={(_event) => setTouched((current) => ({ ...current, email: true }))}
            />

            <div className="register__password-block">
              <PasswordField
                id="register-password"
                label="Senha"
                value={password}
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
                error={showPasswordError ? passwordError : ''}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={(_event) => setTouched((current) => ({ ...current, password: true }))}
              />

              <div className="register__password-hints" aria-live="polite">
                <p className="register__hint-title">Sua senha precisa ter:</p>
                <ul className="register__hint-list">
                  <li className={`register__hint ${passwordChecks.hasMinLength ? 'register__hint--ok' : ''}`}>
                    8 caracteres ou mais
                  </li>
                  <li className={`register__hint ${passwordChecks.hasUppercase ? 'register__hint--ok' : ''}`}>
                    1 letra maiuscula
                  </li>
                  <li className={`register__hint ${passwordChecks.hasLowercase ? 'register__hint--ok' : ''}`}>
                    1 letra minuscula
                  </li>
                  <li className={`register__hint ${passwordChecks.hasNumber ? 'register__hint--ok' : ''}`}>
                    1 numero
                  </li>
                  <li className={`register__hint ${passwordChecks.hasSymbol ? 'register__hint--ok' : ''}`}>
                    1 simbolo
                  </li>
                </ul>
              </div>
            </div>

            <PasswordField
              id="register-confirm-password"
              label="Confirmacao de senha"
              value={confirmPassword}
              placeholder="Repita a senha"
              autoComplete="new-password"
              error={showConfirmError ? confirmPasswordError : ''}
              onChange={(event) => setConfirmPassword(event.target.value)}
              onBlur={(_event) => setTouched((current) => ({ ...current, confirmPassword: true }))}
            />

            {submitError ? (
              <div className="register__feedback register__feedback--error" role="alert" aria-live="polite">
                {submitError}
              </div>
            ) : null}

            {submitSuccess ? (
              <div className="register__feedback register__feedback--success" role="status" aria-live="polite">
                {submitSuccess}
              </div>
            ) : null}

            <button className="register__submit" type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="register__footnote">
            Ja possui conta?{' '}
            <button
              className="register__link-button"
              type="button"
              onClick={onNavigateLogin}
            >
              Entrar agora
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
