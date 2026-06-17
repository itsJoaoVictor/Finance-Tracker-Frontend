import { useEffect, useState } from 'react'
import { userService, UsuarioResponse } from '../../../services/api'

function decodeToken(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function useUsuario() {
  const [user, setUser] = useState<UsuarioResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    const decoded = decodeToken(token)
    const userId = decoded?.user_id

    if (!userId) {
      setError('Token inválido')
      setLoading(false)
      return
    }

    userService.getById(userId)
      .then(res => {
        setUser(res.data)
        setError(null)
      })
      .catch(err => {
        console.error('Erro ao buscar perfil do usuário', err)
        setError('Erro ao carregar dados do usuário')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { user, loading, error }
}
