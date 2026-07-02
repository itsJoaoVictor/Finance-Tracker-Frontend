import { localStorageService, STORAGE_KEYS } from '../localStorageService'
import { defaultUser } from '../mockData'

export const authHandler = (url: string, method: string, data?: any): [number, any] | null => {
  const cleanUrl = url.replace(/^\/api/, '')

  // Login
  if (method === 'post' && cleanUrl === '/usuarios/login') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const user = localStorageService.getItem(STORAGE_KEYS.USER, defaultUser)
    return [
      200,
      {
        token: 'demo-jwt-token-portfolio-mode-1234567890',
        access_token: 'demo-jwt-token-portfolio-mode-1234567890',
        name: user.name,
        email: payload.email || user.email
      }
    ]
  }

  // Register
  if (method === 'post' && cleanUrl === '/usuarios/register') {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const newUser = {
      id: 'demo-user-id-' + Date.now(),
      name: payload.name || 'Usuário Demo Portfólio',
      email: payload.email || 'demo@portifolio.com'
    }
    localStorageService.setItem(STORAGE_KEYS.USER, newUser)
    return [201, { message: 'Usuário cadastrado com sucesso no Modo Demo!' }]
  }

  // Extend Session
  if (method === 'post' && cleanUrl === '/usuarios/extend-session') {
    return [
      200,
      {
        token: 'demo-jwt-token-portfolio-mode-extended-' + Date.now(),
        access_token: 'demo-jwt-token-portfolio-mode-extended-' + Date.now()
      }
    ]
  }

  // Get Me
  if (method === 'get' && cleanUrl === '/usuarios/me') {
    const user = localStorageService.getItem(STORAGE_KEYS.USER, defaultUser)
    return [200, user]
  }

  // Get By Id
  if (method === 'get' && cleanUrl.startsWith('/usuarios/')) {
    const user = localStorageService.getItem(STORAGE_KEYS.USER, defaultUser)
    return [200, user]
  }

  // Update User
  if (method === 'put' && cleanUrl.startsWith('/usuarios/')) {
    const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
    const user = localStorageService.getItem(STORAGE_KEYS.USER, defaultUser)
    const updated = { ...user, ...payload }
    localStorageService.setItem(STORAGE_KEYS.USER, updated)
    return [200, updated]
  }

  // Delete User
  if (method === 'delete' && cleanUrl.startsWith('/usuarios/')) {
    localStorageService.removeItem(STORAGE_KEYS.USER)
    return [200, { message: 'Usuário removido' }]
  }

  // Legacy Expenses endpoints
  if (cleanUrl.startsWith('/expenses')) {
    const expenses = localStorageService.getItem(STORAGE_KEYS.EXPENSES, [] as any[])
    if (method === 'get' && cleanUrl === '/expenses') {
      return [200, expenses]
    }
    if (method === 'post' && cleanUrl === '/expenses') {
      const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
      const newExp = { id: Date.now(), ...payload }
      expenses.push(newExp)
      localStorageService.setItem(STORAGE_KEYS.EXPENSES, expenses)
      return [201, newExp]
    }
    if (method === 'put' && cleanUrl.startsWith('/expenses/')) {
      const id = Number(cleanUrl.split('/')[2])
      const payload = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})
      const idx = expenses.findIndex((e: any) => e.id === id)
      if (idx !== -1) {
        expenses[idx] = { ...expenses[idx], ...payload }
        localStorageService.setItem(STORAGE_KEYS.EXPENSES, expenses)
        return [200, expenses[idx]]
      }
      return [404, { error: 'Despesa não encontrada' }]
    }
    if (method === 'delete' && cleanUrl.startsWith('/expenses/')) {
      const id = Number(cleanUrl.split('/')[2])
      const filtered = expenses.filter((e: any) => e.id !== id)
      localStorageService.setItem(STORAGE_KEYS.EXPENSES, filtered)
      return [200, { success: true }]
    }
  }

  return null
}
