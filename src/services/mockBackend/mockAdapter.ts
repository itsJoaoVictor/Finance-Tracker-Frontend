import { AxiosRequestConfig, AxiosResponse, AxiosAdapter } from 'axios'
import { authHandler } from './handlers/authHandler'
import { categoriaHandler } from './handlers/categoriaHandler'
import { contaHandler } from './handlers/contaHandler'
import { cartaoHandler } from './handlers/cartaoHandler'
import { transacaoHandler } from './handlers/transacaoHandler'
import { dashboardHandler } from './handlers/dashboardHandler'
import { metaHandler } from './handlers/metaHandler'
import { orcamentoHandler } from './handlers/orcamentoHandler'
import { assinaturaHandler } from './handlers/assinaturaHandler'
import { desejoHandler } from './handlers/desejoHandler'
import { agendamentoHandler } from './handlers/agendamentoHandler'
import { tagHandler } from './handlers/tagHandler'
import { relatorioHandler } from './handlers/relatorioHandler'
import { iaHandler } from './handlers/iaHandler'
import { localStorageService } from './localStorageService'

export const mockAdapter: AxiosAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  // Garantir que os dados iniciais estão populados no localStorage
  localStorageService.initializeDefaultData()

  const url = config.url || ''
  const method = (config.method || 'get').toLowerCase()
  const data = config.data
  const params = config.params

  // Simular um pequeno atraso de rede (200ms) para animações de loading suaves na UI
  await new Promise(resolve => setTimeout(resolve, 200))

  console.log(`[Demo LocalStorage Mock] ${method.toUpperCase()} ${url}`, { params, data })

  const result =
    authHandler(url, method, data) ||
    categoriaHandler(url, method, data, params) ||
    contaHandler(url, method, data) ||
    cartaoHandler(url, method, data) ||
    transacaoHandler(url, method, data, params) ||
    dashboardHandler(url, method, data) ||
    metaHandler(url, method, data) ||
    orcamentoHandler(url, method, data) ||
    assinaturaHandler(url, method, data, params) ||
    desejoHandler(url, method, data) ||
    agendamentoHandler(url, method, data) ||
    tagHandler(url, method, data) ||
    relatorioHandler(url, method, data, params) ||
    iaHandler(url, method, data, params)

  if (result) {
    const [status, responseData] = result
    const response: AxiosResponse = {
      data: responseData,
      status,
      statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
      headers: {},
      config: config as any
    }

    if (status >= 200 && status < 300) {
      return response
    } else {
      const error: any = new Error(`Request failed with status code ${status}`)
      error.config = config
      error.response = response
      error.status = status
      throw error
    }
  }

  // Fallback caso algum endpoint tenha sido omitido
  console.warn(`[Demo LocalStorage Mock] Endpoint não coberto no mock: ${method.toUpperCase()} ${url}`)
  const notFoundResponse: AxiosResponse = {
    data: { error: `Endpoint mock não implementado: ${method.toUpperCase()} ${url}` },
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config: config as any
  }
  const error: any = new Error(`Request failed with status code 404`)
  error.config = config
  error.response = notFoundResponse
  error.status = 404
  throw error
}
