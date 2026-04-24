import { useState } from 'react'
import { signIn, signUp } from '../lib/auth'

type Mode = 'login' | 'register'

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
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
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

    if (!form.email || !form.password) {
      setError('Email and password are required.')
      return
    }

    if (mode === 'register') {
      if (!form.fullName.trim()) {
        setError('Please enter your name.')
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        onSuccess()
      } else {
        await signUp(form.email, form.password, form.fullName)
        setSuccessMsg('Account created! Check your email to confirm your account, then log in.')
        switchMode('login')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Gerak<span style={{ color: '#1D9E75' }}>Fit</span>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          {mode === 'login' ? 'Welcome back' : 'Start your fitness journey'}
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '28px 24px',
        width: '100%',
        maxWidth: '380px',
      }}>

        {/* Tab toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f3f4f6',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px',
        }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#111827' : '#6b7280',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'login' ? 'Log in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Success message */}
        {successMsg && (
          <div style={{
            background: '#E1F5EE',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#085041',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}>
            {successMsg}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#991b1b',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {mode === 'register' && (
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                placeholder="Ahmad Atqan"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
              />
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: loading ? '#9FE1CB' : '#1D9E75',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Logging in...' : 'Creating account...')
              : (mode === 'login' ? 'Log in' : 'Create account')
            }
          </button>
        </div>

        {/* Footer note */}
        {mode === 'login' && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
            Don't have an account?{' '}
            <span
              onClick={() => switchMode('register')}
              style={{ color: '#1D9E75', cursor: 'pointer', fontWeight: 500 }}
            >
              Register here
            </span>
          </div>
        )}
      </div>

    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  color: '#111827',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}