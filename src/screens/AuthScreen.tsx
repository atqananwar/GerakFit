import { useState } from 'react'
import { signIn, signUp } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTheme } from '../theme/ThemeContext'

type Mode = 'login' | 'register' | 'forgot'

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface Props {
  onSuccess: () => void
}

export default function AuthScreen({ onSuccess }: Props) {
  const { theme } = useTheme()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function handleChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setSuccessMsg('')
    setForm({ fullName: '', email: '', password: '', confirmPassword: '' })
  }

  async function handleSubmit() {
    setError('')
    setSuccessMsg('')

    if (mode === 'forgot') {
      if (!form.email) { setError('Please enter your email.'); return }
      setLoading(true)
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSuccessMsg('Password reset email sent! Check your inbox and follow the link.')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!form.email || !form.password) { setError('Email and password are required.'); return }

    if (mode === 'register') {
      if (!form.fullName.trim()) { setError('Please enter your name.'); return }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
      if (!/[A-Z]/.test(form.password)) { setError('Password must contain at least one uppercase letter.'); return }
      if (!/[0-9]/.test(form.password)) { setError('Password must contain at least one number.'); return }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        onSuccess()
      } else {
        await signUp(form.email, form.password, form.fullName)
        setSuccessMsg('Account created! Check your email to confirm, then log in.')
        switchMode('login')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const LBL: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: theme.text, marginBottom: '5px' }
  const INP: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '8px', border: `0.5px solid ${theme.border}`, fontSize: '14px', color: theme.text, background: theme.inputBackground, outline: 'none', boxSizing: 'border-box' }

  const subtitles: Record<Mode, string> = {
    login: 'Welcome back',
    register: 'Start your fitness journey',
    forgot: 'Reset your password',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.background, padding: '24px', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: theme.text }}>Gerak</span><span style={{ color: '#1D9E75' }}>Fit</span>
        </div>
        <div style={{ fontSize: '14px', color: theme.textSecondary, marginTop: '4px' }}>{subtitles[mode]}</div>
      </div>

      <div style={{ background: theme.card, border: `0.5px solid ${theme.border}`, borderRadius: '14px', padding: '28px 24px', width: '100%', maxWidth: '380px' }}>

        {mode !== 'forgot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: theme.border, borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: mode === m ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s', background: mode === m ? theme.card : 'transparent', color: mode === m ? theme.text : theme.textSecondary, boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                {m === 'login' ? 'Log in' : 'Register'}
              </button>
            ))}
          </div>
        )}

        {mode === 'forgot' && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => switchMode('login')} style={{ fontSize: '13px', color: theme.textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>← Back to login</button>
            <div style={{ fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>Enter your email and we'll send you a link to reset your password.</div>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#085041', marginBottom: '16px', lineHeight: '1.5' }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ background: theme.dangerMuted, borderRadius: '8px', padding: '12px', fontSize: '13px', color: theme.danger, marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {mode === 'register' && (
            <div>
              <label style={LBL}>Full name</label>
              <input type="text" placeholder="Ahmad Atqan" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} style={INP} />
            </div>
          )}

          <div>
            <label style={LBL}>Email</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => handleChange('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={INP} />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label style={LBL}>Password</label>
              <input type="password" placeholder={mode === 'register' ? 'Min. 8 chars, 1 uppercase, 1 number' : '••••••••'} value={form.password} onChange={e => handleChange('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={INP} />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label style={LBL}>Confirm password</label>
              <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={INP} />
            </div>
          )}

          {mode === 'register' && form.password.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[0-9]/.test(form.password),
                  /[^A-Za-z0-9]/.test(form.password),
                ].map((met, i) => (
                  <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: met ? '#1D9E75' : theme.border, transition: 'background 0.2s' }} />
                ))}
              </div>
              <div style={{ fontSize: '11px', color: theme.textSecondary }}>
                {[
                  form.password.length >= 8 ? null : '8+ chars',
                  /[A-Z]/.test(form.password) ? null : 'uppercase',
                  /[0-9]/.test(form.password) ? null : 'number',
                ].filter(Boolean).join(', ') || 'Strong password ✓'}
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{ marginTop: '4px', width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: loading ? '#9FE1CB' : '#1D9E75', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading
              ? (mode === 'login' ? 'Logging in...' : mode === 'register' ? 'Creating account...' : 'Sending...')
              : (mode === 'login' ? 'Log in' : mode === 'register' ? 'Create account' : 'Send reset link')
            }
          </button>
        </div>

        {mode === 'login' && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>
              Don't have an account?{' '}
              <span onClick={() => switchMode('register')} style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 500 }}>Register here</span>
            </div>
            <div style={{ fontSize: '12px' }}>
              <span onClick={() => switchMode('forgot')} style={{ color: theme.textSecondary, cursor: 'pointer' }}>Forgot password?</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
