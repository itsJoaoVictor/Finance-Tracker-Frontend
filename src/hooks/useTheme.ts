import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'

export const THEMES = {
  light: {
    '--bg': '#f8fafc',
    '--bg-accent': '#e2e8f0',
    '--ink': '#0f172a',
    '--muted': '#64748b',
    '--card': '#ffffff',
    '--accent': '#2563eb',
    '--accent-2': '#475569',
    '--field-bg': '#ffffff',
    '--field-border': 'rgba(15, 23, 42, 0.16)',
    background: 'linear-gradient(140deg, #f8fafc 0%, #e2e8f0 100%)'
  },
  dark: {
    '--bg': '#0b0c0e',
    '--bg-accent': '#16181c',
    '--ink': '#f3f4f6',
    '--muted': '#9ca3af',
    '--card': '#1f2937',
    '--accent': '#00f5a0',
    '--accent-2': '#3b82f6',
    '--field-bg': '#1f2937',
    '--field-border': 'rgba(243, 244, 246, 0.16)',
    background: 'linear-gradient(140deg, #0b0c0e 0%, #16181c 100%)'
  }
}

export function applyTheme(themeName: Theme) {
  const root = document.documentElement
  const variables = THEMES[themeName]
  
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
