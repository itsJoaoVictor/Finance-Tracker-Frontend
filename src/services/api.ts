import axios from 'axios'
import { Expense, Category, RegisterRequest } from '../types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Expenses
export const expenseService = {
  getAll: () => api.get<Expense[]>('/expenses'),
  getById: (id: number) => api.get<Expense>(`/expenses/${id}`),
  create: (expense: Omit<Expense, 'id'>) => api.post<Expense>('/expenses', expense),
  update: (id: number, expense: Omit<Expense, 'id'>) => api.put<Expense>(`/expenses/${id}`, expense),
  delete: (id: number) => api.delete(`/expenses/${id}`),
}

// Categories
export const categoryService = {
  getAll: () => api.get<Category[]>('/categories'),
  getById: (id: number) => api.get<Category>(`/categories/${id}`),
  create: (category: Omit<Category, 'id'>) => api.post<Category>('/categories', category),
  update: (id: number, category: Omit<Category, 'id'>) => api.put<Category>(`/categories/${id}`, category),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

// Auth
export const authService = {
  register: (payload: RegisterRequest) => api.post<void>('/usuarios/register', payload),
}
