import {
  defaultUser,
  defaultCategories,
  defaultContas,
  defaultCartoes,
  defaultFaturas,
  defaultTransacoes,
  defaultMetas,
  defaultOrcamentos,
  defaultAssinaturas,
  defaultDesejos,
  defaultAgendamentos,
  defaultTags,
  defaultInsightsIa
} from './mockData'

export const STORAGE_KEYS = {
  INITIALIZED: 'demo_initialized',
  USER: 'demo_user',
  CATEGORIES: 'demo_categories',
  CONTAS: 'demo_contas',
  CARTOES: 'demo_cartoes',
  FATURAS: 'demo_faturas',
  TRANSACOES: 'demo_transacoes',
  METAS: 'demo_metas',
  ORCAMENTOS: 'demo_orcamentos',
  ASSINATURAS: 'demo_assinaturas',
  DESEJOS: 'demo_desejos',
  AGENDAMENTOS: 'demo_agendamentos',
  TAGS: 'demo_tags',
  INSIGHTS_IA: 'demo_insights_ia',
  DASHBOARD_LAYOUT: 'demo_dashboard_layout',
  EXPENSES: 'demo_expenses'
}

export const localStorageService = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Erro ao ler ${key} do localStorage:`, error)
      return defaultValue
    }
  },

  setItem: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error)
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Erro ao remover ${key} do localStorage:`, error)
    }
  },

  initializeDefaultData: (): void => {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED)
    if (!initialized || initialized !== 'true') {
      localStorageService.setItem(STORAGE_KEYS.USER, defaultUser)
      localStorageService.setItem(STORAGE_KEYS.CATEGORIES, defaultCategories)
      localStorageService.setItem(STORAGE_KEYS.CONTAS, defaultContas)
      localStorageService.setItem(STORAGE_KEYS.CARTOES, defaultCartoes)
      localStorageService.setItem(STORAGE_KEYS.FATURAS, defaultFaturas)
      localStorageService.setItem(STORAGE_KEYS.TRANSACOES, defaultTransacoes)
      localStorageService.setItem(STORAGE_KEYS.METAS, defaultMetas)
      localStorageService.setItem(STORAGE_KEYS.ORCAMENTOS, defaultOrcamentos)
      localStorageService.setItem(STORAGE_KEYS.ASSINATURAS, defaultAssinaturas)
      localStorageService.setItem(STORAGE_KEYS.DESEJOS, defaultDesejos)
      localStorageService.setItem(STORAGE_KEYS.AGENDAMENTOS, defaultAgendamentos)
      localStorageService.setItem(STORAGE_KEYS.TAGS, defaultTags)
      localStorageService.setItem(STORAGE_KEYS.INSIGHTS_IA, defaultInsightsIa)
      localStorageService.setItem(STORAGE_KEYS.DASHBOARD_LAYOUT, { ordemWidgets: [], widgetsOcultos: [] })
      localStorageService.setItem(STORAGE_KEYS.EXPENSES, [])
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true')
    }
  },

  resetToDefaultData: (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
    localStorageService.initializeDefaultData()
    window.dispatchEvent(new Event('demo-data-reset'))
  }
}

// Inicializa no carregamento do módulo
localStorageService.initializeDefaultData()
