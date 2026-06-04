// Types para a aplicação

export interface Expense {
  id: number
  description: string
  amount: number
  category: string
  date: string
  notes?: string
}

export interface Category {
  id: number
  name: string
  color?: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}
