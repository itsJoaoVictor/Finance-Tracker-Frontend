import { useState, useEffect } from 'react'
import { useUsuario } from '../hooks/useUsuario'
import { userService } from '../../../services/api'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Perfil.css'

export function Perfil() {
  const { user, loading, error: userError } = useUsuario()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackSuccess, setFeedbackSuccess] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Confirmation Modal State
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const validate = () => {
    let valid = true
    setNameError('')
    setEmailError('')

    if (!name.trim()) {
      setNameError('O nome não pode estar em branco.')
      valid = false
    } else if (name.trim().length < 3) {
      setNameError('O nome deve ter pelo menos 3 caracteres.')
      valid = false
    }

    if (!email.trim()) {
      setEmailError('O e-mail não pode estar em branco.')
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Formato de e-mail inválido.')
      valid = false
    }

    return valid
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackError('')
    setFeedbackSuccess('')

    if (!validate() || !user) return

    setIsUpdating(true)
    try {
      await userService.update(user.id, { name, email })
      setFeedbackSuccess('Perfil atualizado com sucesso!')
      // Refresh the page or update global state as needed. 
      // A full page reload is a simple way to refresh navbar/sidebar values
      window.setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 409) {
          setFeedbackError('Este e-mail já está em uso.')
        } else if (status === 400) {
          setFeedbackError('Revise os dados informados.')
        } else {
          setFeedbackError('Não foi possível atualizar o perfil.')
        }
      } else {
        setFeedbackError('Ocorreu um erro inesperado.')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      await userService.delete(user.id)
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('sessionExpiration')
      navigate('/login')
    } catch (err) {
      setFeedbackError('Não foi possível excluir a conta.')
      setShowConfirmDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <div className="perfil-loading">Carregando dados do perfil...</div>
  }

  if (userError || !user) {
    return <div className="perfil-error">Não foi possível carregar as informações do perfil.</div>
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h2 className="perfil-title">Meu Perfil</h2>
        <p className="perfil-subtitle">Gerencie suas informações pessoais e de login.</p>

        <form onSubmit={handleUpdate} className="perfil-form" noValidate>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Nome Completo</label>
            <input
              id="name"
              type="text"
              className={`form-input ${nameError ? 'form-input--error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
            />
            {nameError && <span className="error-message">{nameError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">E-mail de Acesso</label>
            <input
              id="email"
              type="email"
              className={`form-input ${emailError ? 'form-input--error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
            {emailError && <span className="error-message">{emailError}</span>}
          </div>

          {feedbackError && (
            <div className="feedback-message feedback-message--error">
              {feedbackError}
            </div>
          )}

          {feedbackSuccess && (
            <div className="feedback-message feedback-message--success">
              {feedbackSuccess}
            </div>
          )}

          <div className="perfil-actions">
            <button
              type="submit"
              className="btn-save"
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>

            <button
              type="button"
              className="btn-delete-trigger"
              onClick={() => setShowConfirmDelete(true)}
              disabled={isUpdating || isDeleting}
            >
              Excluir Conta
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Confirmar Exclusão de Conta</h3>
            <p className="modal-text">
              Tem certeza de que deseja excluir sua conta? Esta ação desativará seu acesso ao Finance Tracker e é irreversível.
            </p>
            <div className="modal-actions">
              <button
                className="btn-confirm-delete"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Conta'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
