import { useState, useEffect } from 'react'
import { signIn, signUp } from '../lib/auth'
import { supabase } from '../lib/supabase'

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
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  useEffect(() => { document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb' }, [darkMode])
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

  const LBL: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: darkMode ? '#d1d5db' : '#2a2a2a', marginBottom: '5px' }
  const INP: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '8px', border: `0.5px solid ${darkMode ? '#2a2a2a' : '#e5e7eb'}`, fontSize: '14px', color: darkMode ? '#ffffff' : '#111827', background: darkMode ? '#141414' : '#fff', outline: 'none', boxSizing: 'border-box' }

  const subtitles: Record<Mode, string> = {
    login: 'Welcome back',
    register: 'Start your fitness journey',
    forgot: 'Reset your password',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#0d0d0d' : '#f9fafb', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#ffffff' }}>Gerak</span><span style={{ color: '#1D9E75' }}>Fit</span>
        </div>
        <div style={{ fontSize: '14px', color: '#888888', marginTop: '4px' }}>{subtitles[mode]}</div>
      </div>

      <div style={{ background: darkMode ? '#1c1c1e' : '#fff', border: `0.5px solid ${darkMode ? '#2a2a2a' : '#e5e7eb'}`, borderRadius: '14px', padding: '28px 24px', width: '100%', maxWidth: '380px' }}>

        {/* Tabs — only login/register */}
        {mode !== 'forgot' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: darkMode ? '#2a2a2a' : '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: mode === m ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s', background: mode === m ? (darkMode ? '#222222' : '#fff') : 'transparent', color: mode === m ? (darkMode ? '#ffffff' : '#111827') : (darkMode ? '#666666' : '#6b7280'), boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                {m === 'login' ? 'Log in' : 'Register'}
              </button>
            ))}
          </div>
        )}

        {/* Forgot header */}
        {mode === 'forgot' && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => switchMode('login')} style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>← Back to login</button>
            <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', lineHeight: 1.6 }}>Enter your email and we'll send you a link to reset your password.</div>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#085041', marginBottom: '16px', lineHeight: '1.5' }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#991b1b', marginBottom: '16px' }}>
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

          {/* Password strength indicator for register */}
          {mode === 'register' && form.password.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[0-9]/.test(form.password),
                  /[^A-Za-z0-9]/.test(form.password),
                ].map((met, i) => (
                  <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: met ? '#1D9E75' : '#2a2a2a', transition: 'background 0.2s' }} />
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#888888' }}>
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

        {/* Footer links */}
        {mode === 'login' && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888888', marginBottom: '8px' }}>
              Don't have an account?{' '}
              <span onClick={() => switchMode('register')} style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 500 }}>Register here</span>
            </div>
            <div style={{ fontSize: '12px' }}>
              <span onClick={() => switchMode('forgot')} style={{ color: '#888888', cursor: 'pointer' }}>Forgot password?</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
