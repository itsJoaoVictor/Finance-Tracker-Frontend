import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'

export const THEMES = {
  light: {
    '--bg': '#f4f7f9',
    '--bg-accent': '#e2e8f0',
    '--ink': '#0f172a',
    '--ink-secondary': '#334155',
    '--muted': '#64748b',
    '--card': '#ffffff',
    '--surface-subtle': '#f8fafc',
    '--surface-hover': '#f1f5f9',
    '--border-subtle': 'rgba(15, 23, 42, 0.08)',
    '--border-strong': 'rgba(15, 23, 42, 0.14)',
    '--primary': '#059669',
    '--primary-hover': '#047857',
    '--primary-soft': 'rgba(5, 150, 105, 0.10)',
    '--accent': '#059669',
    '--accent-2': '#059669',
    '--btn-accent-text': '#ffffff',
    '--green-positive': '#16a34a',
    '--green-soft': 'rgba(22, 163, 74, 0.10)',
    '--warning': '#d97706',
    '--warning-soft': 'rgba(217, 119, 6, 0.12)',
    '--danger': '#e11d48',
    '--danger-soft': 'rgba(225, 29, 72, 0.10)',
    '--info': '#2563eb',
    '--info-soft': 'rgba(37, 99, 235, 0.10)',
    '--field-bg': '#ffffff',
    '--field-border': 'rgba(15, 23, 42, 0.16)',
    '--shadow-card': '0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.05)',
    '--shadow-card-hover': '0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 32px -6px rgba(15, 23, 42, 0.08)',
    background: 'radial-gradient(900px 500px at 8% -10%, rgba(16, 185, 129, 0.07) 0%, transparent 60%), radial-gradient(800px 480px at 95% 5%, rgba(37, 99, 235, 0.05) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
  },
  dark: {
    '--bg': '#090d16',
    '--bg-accent': '#161f30',
    '--ink': '#f8fafc',
    '--ink-secondary': '#cbd5e1',
    '--muted': '#94a3b8',
    '--card': '#111827',
    '--surface-subtle': '#172033',
    '--surface-hover': '#1e293b',
    '--border-subtle': 'rgba(255, 255, 255, 0.07)',
    '--border-strong': 'rgba(255, 255, 255, 0.14)',
    '--primary': '#10b981',
    '--primary-hover': '#059669',
    '--primary-soft': 'rgba(16, 185, 129, 0.14)',
    '--accent': '#10b981',
    '--accent-2': '#10b981',
    '--btn-accent-text': '#04130e',
    '--green-positive': '#10b981',
    '--green-soft': 'rgba(16, 185, 129, 0.14)',
    '--warning': '#f59e0b',
    '--warning-soft': 'rgba(245, 158, 11, 0.14)',
    '--danger': '#fb7185',
    '--danger-soft': 'rgba(251, 113, 133, 0.14)',
    '--info': '#38bdf8',
    '--info-soft': 'rgba(56, 189, 248, 0.14)',
    '--field-bg': '#0f172a',
    '--field-border': 'rgba(248, 250, 252, 0.14)',
    '--shadow-card': '0 2px 6px rgba(0, 0, 0, 0.25), 0 12px 28px -6px rgba(0, 0, 0, 0.35)',
    '--shadow-card-hover': '0 8px 24px rgba(0, 0, 0, 0.4), 0 16px 36px -6px rgba(0, 0, 0, 0.5)',
    background: 'radial-gradient(900px 500px at 10% -10%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), radial-gradient(800px 500px at 92% 4%, rgba(56, 189, 248, 0.06) 0%, transparent 55%), linear-gradient(180deg, #090d16 0%, #0d1320 100%)'
  }
}

export function applyTheme(themeName: Theme) {
  const root = document.documentElement
  const variables = THEMES[themeName]
  
  root.setAttribute('data-theme', themeName)

  Object.entries(variables).forEach(([key, value]) => {
    if (key !== 'background') {
      root.style.setProperty(key, value)
    }
  })
  
  document.body.style.background = variables.background
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('selected-theme')
    return (saved === 'light' || saved === 'dark') ? saved : 'light'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem('selected-theme', newTheme)
    setThemeState(newTheme)
    applyTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('selected-theme', next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
