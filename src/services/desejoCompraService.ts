import api from './api'

export interface DesejoCompra {
  id: string
  nome: string
  valor: number
}

export const desejoCompraService = {
  listarDesejos: () => api.get<DesejoCompra[]>('/api/desejos-compra'),
  
  criarDesejo: (nome: string, valor: number) => 
    api.post<DesejoCompra>('/api/desejos-compra', { nome, valor }),
  
  atualizarDesejo: (id: string, nome: string, valor: number) => 
    api.put<DesejoCompra>(`/api/desejos-compra/${id}`, { nome, valor }),
  
  deletarDesejo: (id: string) => 
    api.delete(`/api/desejos-compra/${id}`)
}
