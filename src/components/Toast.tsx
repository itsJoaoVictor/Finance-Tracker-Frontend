import { useEffect, useState, useCallback } from 'react'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastSingle key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastSingle({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className={`toast toast--${toast.type}`} onClick={() => onDismiss(toast.id)}>
      <span className="toast__icon">{toast.type === 'success' ? '✓' : '✕'}</span>
      <span>{toast.message}</span>
    </div>
  )
}

const CLEAN_ERROR_MAP: Record<string, string> = {
  "nao autenticado": "Sua sessão expirou. Por favor, faça login novamente.",
  "credenciais invalidas": "E-mail ou senha incorretos. Por favor, tente novamente.",
  "muitas tentativas de login": "Muitas tentativas de login. Por favor, tente novamente mais tarde.",
  "conta inativa": "Esta conta está desativada. Entre em contato com o suporte.",
  "conta nao verificada": "Sua conta ainda não foi verificada. Verifique seu e-mail.",
  "conta bloqueada": "Esta conta foi bloqueada por segurança.",
  "senha expirada": "Sua senha expirou. Por favor, altere sua senha.",
  "email ja cadastrado": "Este e-mail já está cadastrado no sistema.",
  "nome ja cadastrado": "Este nome de usuário já está sendo utilizado.",
  "dados invalidos": "Os dados fornecidos são inválidos. Por favor, verifique-os.",
  "as senhas nao coincidem": "As senhas informadas não coincidem.",
  "senha fraca": "A senha digitada é muito fraca. Escolha uma senha mais forte.",
  "senha incorreta": "A senha informada está incorreta.",
  "acesso negado": "Você não tem permissão para realizar esta ação.",
  "usuario ja deletado": "Este usuário já foi excluído do sistema.",
  "usuario nao encontrado": "Usuário não localizado no sistema.",
  "usuario inativo": "O usuário está inativo.",
  "o limite nao pode ser negativo": "O limite de crédito do cartão não pode ser um valor negativo.",
  "cartao nao encontrado": "O cartão de crédito selecionado não foi encontrado.",
  "cartao nao associado": "Nenhum cartão de crédito está associado a esta transação.",
  "conta nao encontrada": "A conta bancária selecionada não foi encontrada.",
  "saldo insuficiente para realizar o saque": "Saldo insuficiente na conta para realizar o saque.",
  "saldo insuficiente para realizar o pix": "Saldo insuficiente na conta para realizar a transferência via Pix.",
  "saldo insuficiente para realizar a transferencia": "Saldo insuficiente na conta para realizar a transferência.",
  "limite de credito insuficiente": "O limite do cartão de crédito é insuficiente para esta compra.",
  "pagamento total so pode ser realizado em faturas fechadas": "O pagamento total só pode ser efetuado em faturas que já foram fechadas.",
  "pagamento total deve ser realizado ate o vencimento": "O pagamento total deve ser realizado até a data de vencimento da fatura.",
  "valor do pagamento excede o saldo devedor da fatura": "O valor informado é maior do que o saldo devedor restante desta fatura.",
  "pagamento antecipado so pode ser realizado em faturas abertas": "O pagamento antecipado só é permitido em faturas que ainda estão abertas.",
  "tipo de pagamento invalido": "O tipo de pagamento de fatura selecionado é inválido.",
  "contadestinoid e obrigatorio para deposito": "A conta de destino é obrigatória para realizar um depósito.",
  "contaorigemid e obrigatorio para saque": "A conta de origem é obrigatória para realizar um saque.",
  "contaorigemid e obrigatorio para pix": "A conta de origem é obrigatória para realizar uma transferência via Pix.",
  "cartaoid e obrigatorio para compra credito": "O cartão de crédito é obrigatório para realizar uma compra no crédito.",
  "tipo invalido para agendamento use deposito saque ou pix": "O tipo de agendamento selecionado é inválido. Escolha Depósito, Saque ou Pix.",
  "transacao ja estornada": "Esta transação já foi estornada anteriormente.",
  "assinatura nao encontrada": "A assinatura não foi encontrada.",
  "categoria nao encontrada": "A categoria selecionada não foi encontrada.",
  "nao e permitido alterar ou inativar categorias padrao do sistema": "Não é permitido alterar ou remover as categorias padrão do sistema.",
  "limite maximo de 50 categorias customizadas atingido": "Você atingiu o limite máximo de 50 categorias personalizadas.",
  "ja existe uma categoria ativa com este nome": "Já existe uma categoria ativa cadastrada com este nome.",
  "agendamento nao encontrado": "O agendamento de transação não foi localizado.",
  "fatura nao encontrada": "A fatura do cartão não foi encontrada.",
  "meta de economia nao encontrada": "A meta de economia (cofrinho) não foi encontrada.",
  "tag nao encontrada": "A tag selecionada não foi encontrada.",
  "transacao nao encontrada": "A transação não foi encontrada."
}

function cleanString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9\s]/g, '')  // remove special chars/punctuation
    .toLowerCase()
    .trim()
}

function getFriendlyMessage(message: string): string {
  const cleaned = cleanString(message)
  for (const [key, val] of Object.entries(CLEAN_ERROR_MAP)) {
    if (cleaned.includes(key)) {
      return val
    }
  }
  return message
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now()
    const mappedMessage = type === 'error' ? getFriendlyMessage(message) : message
    setToasts((prev) => [...prev, { id, message: mappedMessage, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, dismiss }
}