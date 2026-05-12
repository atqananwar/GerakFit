import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export const DARK_THEME = {
  background: '#0d0d0d',
  surface: '#111111',
  card: '#1c1c1e',
  text: '#ffffff',
  textSecondary: '#888888',
  textTertiary: '#555555',
  border: '#2a2a2a',
  borderSubtle: '#1a1a1a',
  primary: '#1D9E75',
  primaryMuted: '#0f2a1a',
  danger: '#ef4444',
  dangerMuted: '#2a0f0f',
  inputBackground: '#111111',
  tabBarBackground: '#0d0d0d',
  headerBackground: '#0d0d0d',
  placeholder: '#444444',
}

export const LIGHT_THEME = {
  background: '#f2f2f7',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#000000',
  textSecondary: '#555555',
  textTertiary: '#888888',
  border: '#e5e5ea',
  borderSubtle: '#ebebf0',
  primary: '#1D9E75',
  primaryMuted: '#e1f5ee',
  danger: '#ef4444',
  dangerMuted: '#fef2f2',
  inputBackground: '#ffffff',
  tabBarBackground: '#f9f9f9',
  headerBackground: '#ffffff',
  placeholder: '#aaaaaa',
}

export type Theme = typeof DARK_THEME

type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DARK_THEME,
  mode: 'dark',
  setMode: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('gerakfit-theme') as ThemeMode) || 'dark'
  })

  const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark)
  const theme = isDark ? DARK_THEME : LIGHT_THEME

  function setMode(newMode: ThemeMode) {
    setModeState(newMode)
    localStorage.setItem('gerakfit-theme', newMode)
    const dark = newMode === 'dark' || (newMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    localStorage.setItem('gerakfit-dark', dark ? 'true' : 'false')
  }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (mode === 'system') setModeState('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  useEffect(() => {
    document.body.style.background = theme.background
    document.body.style.color = theme.text
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
