import { useEffect, useState } from 'react'
import { Expense } from '../types'
import { expenseService } from '../services/api'

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const response = await expenseService.getAll()
      setExpenses(response.data)
    } catch (error) {
      console.error('Erro ao carregar despesas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <h2>Despesas</h2>
      {expenses.length === 0 ? (
        <p>Nenhuma despesa registrada</p>
      ) : (
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id}>
              {expense.description} - R$ {expense.amount.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
