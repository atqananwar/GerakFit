// Shared dark mode hook and color tokens for GerakFit

export function getDarkMode(): boolean {
  return localStorage.getItem('gerakfit-dark') !== 'false'
}

export function setDarkMode(value: boolean) {
  localStorage.setItem('gerakfit-dark', String(value))
  document.body.style.background = value ? '#111827' : '#f9fafb'
}

export function getTheme(dark: boolean) {
  return {
    bg: dark ? '#111827' : '#f9fafb',
    card: dark ? '#1f2937' : '#ffffff',
    border: dark ? '#374151' : '#e5e7eb',
    surface: dark ? '#374151' : '#f3f4f6',
    textPrimary: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#9ca3af' : '#6b7280',
    textTertiary: dark ? '#6b7280' : '#9ca3af',
    accent: '#1D9E75',
    accentBg: dark ? '#064e3b' : '#E1F5EE',
    accentText: dark ? '#6ee7b7' : '#085041',
    danger: '#ef4444',
    dangerBg: dark ? '#450a0a' : '#fef2f2',
    inputBg: dark ? '#374151' : '#ffffff',
    inputBorder: dark ? '#4b5563' : '#e5e7eb',
  }
}

export type Theme = ReturnType<typeof getTheme>