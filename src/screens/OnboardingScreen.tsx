import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const EQUIPMENT_OPTIONS = [
  { id: 'Bodyweight', label: 'Bodyweight', desc: 'No equipment needed' },
  { id: 'Dumbbell', label: 'Dumbbells', desc: 'Fixed or adjustable' },
  { id: 'Barbell', label: 'Barbell', desc: 'With plates and rack' },
  { id: 'Cable', label: 'Cable machine', desc: 'Pulley system' },
  { id: 'Smith Machine', label: 'Smith machine', desc: 'Guided barbell' },
  { id: 'Machine', label: 'Machines', desc: 'Chest press, leg press, etc.' },
  { id: 'Resistance Band', label: 'Resistance bands', desc: 'Light bands or heavy' },
  { id: 'Cardio', label: 'Cardio machines', desc: 'Treadmill, bike, rower' },
]

type Goal = 'muscle_gain' | 'fat_loss' | 'strength' | 'general_fitness'
type Experience = 'beginner' | 'intermediate' | 'advanced'

interface OnboardingData {
  goal: Goal | ''
  experience: Experience | ''
  trainingDays: number
  sessionLength: number
  equipment: string[]
  injuryNotes: string
}

interface Props {
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  useEffect(() => { document.body.style.background = darkMode ? '#000000' : '#f9fafb' }, [darkMode])
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const totalSteps = 4
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [data, setData] = useState<OnboardingData>({
    goal: '',
    experience: '',
    trainingDays: 3,
    sessionLength: 60,
    equipment: ['Bodyweight'],
    injuryNotes: '',
  })

  function toggleEquipment(id: string) {
    setData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(id)
        ? prev.equipment.filter(e => e !== id)
        : [...prev.equipment, id],
    }))
  }

  function canProceed() {
    if (step === 1) return data.goal !== ''
    if (step === 2) return data.experience !== ''
    if (step === 3) return true
    if (step === 4) return data.equipment.length > 0
    return true
  }

  async function handleFinish() {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          goal: data.goal,
          experience_level: data.experience,
          training_days_per_week: data.trainingDays,
          session_length_minutes: data.sessionLength,
          injury_notes: data.injuryNotes || null,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      const equipmentRows = data.equipment.map(eq => ({
        user_id: user.id,
        equipment_name: eq,
        is_available: true,
      }))

      await supabase.from('user_equipment').delete().eq('user_id', user.id)

      const { error: equipError } = await supabase
        .from('user_equipment')
        .insert(equipmentRows)

      if (equipError) throw equipError

      onComplete()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const goals: { id: Goal; label: string; desc: string }[] = [
    { id: 'muscle_gain', label: 'Build muscle', desc: 'Increase size and definition' },
    { id: 'strength', label: 'Get stronger', desc: 'Improve lifts and power' },
    { id: 'fat_loss', label: 'Lose fat', desc: 'Burn calories, stay lean' },
    { id: 'general_fitness', label: 'General fitness', desc: 'Stay healthy and active' },
  ]

  const experiences: { id: Experience; label: string; desc: string }[] = [
    { id: 'beginner', label: 'Beginner', desc: 'Less than 1 year training' },
    { id: 'intermediate', label: 'Intermediate', desc: '1–3 years consistent training' },
    { id: 'advanced', label: 'Advanced', desc: '3+ years, knows the basics well' },
  ]

  const stepTitleStyle: React.CSSProperties = {
    fontSize: '26px', fontWeight: 800, color: darkMode ? '#ffffff' : '#111827', marginBottom: '6px',
  }
  const stepDescStyle: React.CSSProperties = {
    fontSize: '14px', color: '#444', lineHeight: '1.5',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#000000' : '#f9fafb',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 20px',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '420px', marginBottom: '28px' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '16px' }}>
          Gerak<span style={{ color: '#1D9E75' }}>Fit</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: i < step ? '#1D9E75' : (darkMode ? '#1a1a1a' : '#e5e7eb'),
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step {step} of {totalSteps}</div>
      </div>

      {/* Card */}
      <div style={{
        background: darkMode ? '#111111' : '#fff',
        border: `0.5px solid ${darkMode ? '#1a1a1a' : '#e5e7eb'}`,
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '420px',
      }}>

        {/* Step 1 — Goal */}
        {step === 1 && (
          <>
            <div style={stepTitleStyle}>What is your main goal?</div>
            <div style={stepDescStyle}>This helps GerakFit choose the right exercises and program for you.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {goals.map(g => (
                <div
                  key={g.id}
                  onClick={() => setData(prev => ({ ...prev, goal: g.id }))}
                  style={{
                    ...optionStyle,
                    border: darkMode
                      ? (data.goal === g.id ? '1.5px solid #1D9E75' : '0.5px solid #1a1a1a')
                      : (data.goal === g.id ? '1.5px solid #1D9E75' : '1.5px solid #e5e7eb'),
                    background: darkMode ? '#111111' : (data.goal === g.id ? '#E1F5EE' : '#fff'),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: `2px solid ${data.goal === g.id ? '#1D9E75' : '#d1d5db'}`,
                      background: data.goal === g.id ? '#1D9E75' : 'transparent',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: darkMode ? (data.goal === g.id ? '#1D9E75' : '#ffffff') : (data.goal === g.id ? '#085041' : '#111827') }}>{g.label}</div>
                      <div style={{ fontSize: '12px', color: darkMode ? (data.goal === g.id ? '#1D9E75' : '#555555') : (data.goal === g.id ? '#0F6E56' : '#6b7280'), marginTop: '1px' }}>{g.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 2 — Experience */}
        {step === 2 && (
          <>
            <div style={stepTitleStyle}>What is your experience level?</div>
            <div style={stepDescStyle}>Be honest — beginners get safer exercise recommendations.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {experiences.map(e => (
                <div
                  key={e.id}
                  onClick={() => setData(prev => ({ ...prev, experience: e.id }))}
                  style={{
                    ...optionStyle,
                    border: darkMode
                      ? (data.experience === e.id ? '1.5px solid #1D9E75' : '0.5px solid #1a1a1a')
                      : (data.experience === e.id ? '1.5px solid #1D9E75' : '1.5px solid #e5e7eb'),
                    background: darkMode ? '#111111' : (data.experience === e.id ? '#E1F5EE' : '#fff'),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: `2px solid ${data.experience === e.id ? '#1D9E75' : '#d1d5db'}`,
                      background: data.experience === e.id ? '#1D9E75' : 'transparent',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: darkMode ? (data.experience === e.id ? '#1D9E75' : '#ffffff') : (data.experience === e.id ? '#085041' : '#111827') }}>{e.label}</div>
                      <div style={{ fontSize: '12px', color: darkMode ? (data.experience === e.id ? '#1D9E75' : '#555555') : (data.experience === e.id ? '#0F6E56' : '#6b7280'), marginTop: '1px' }}>{e.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 3 — Schedule */}
        {step === 3 && (
          <>
            <div style={stepTitleStyle}>Training schedule</div>
            <div style={stepDescStyle}>How many days per week and how long are your sessions?</div>

            <div style={{ marginTop: '24px' }}>
              <div style={sliderLabelStyle}>
                <span>Days per week</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#1D9E75', textTransform: 'none' }}>{data.trainingDays}</span>
              </div>
              <input
                type="range" min="2" max="6" step="1"
                value={data.trainingDays}
                onChange={e => setData(prev => ({ ...prev, trainingDays: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#1D9E75' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                <span>2 days</span><span>6 days</span>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div style={sliderLabelStyle}>
                <span>Session length</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#1D9E75', textTransform: 'none' }}>{data.sessionLength} min</span>
              </div>
              <input
                type="range" min="30" max="120" step="15"
                value={data.sessionLength}
                onChange={e => setData(prev => ({ ...prev, sessionLength: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#1D9E75' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                <span>30 min</span><span>120 min</span>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: darkMode ? '#555555' : '#374151', display: 'block', marginBottom: '8px' }}>
                Any injuries or areas to avoid? <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea
                placeholder="e.g. Left knee pain, avoid heavy squats"
                value={data.injuryNotes}
                onChange={e => setData(prev => ({ ...prev, injuryNotes: e.target.value }))}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  borderRadius: '8px', border: `0.5px solid ${darkMode ? '#1a1a1a' : '#e5e7eb'}`,
                  fontSize: '13px', color: darkMode ? '#f9fafb' : '#111827', resize: 'none',
                  background: darkMode ? '#000000' : '#fff',
                  fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
                }}
              />
            </div>
          </>
        )}

        {/* Step 4 — Equipment */}
        {step === 4 && (
          <>
            <div style={stepTitleStyle}>What equipment do you have?</div>
            <div style={stepDescStyle}>Select everything available at your gym. This filters exercise suggestions.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
              {EQUIPMENT_OPTIONS.map(eq => {
                const selected = data.equipment.includes(eq.id)
                return (
                  <div
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    style={{
                      height: '44px', padding: '0 16px',
                      display: 'flex', alignItems: 'center',
                      borderRadius: '22px', cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: selected ? '#1D9E75' : (darkMode ? '#111111' : '#f3f4f6'),
                      border: selected ? 'none' : (darkMode ? '0.5px solid #1a1a1a' : '0.5px solid #e5e7eb'),
                      fontSize: '14px', fontWeight: 500,
                      color: selected ? '#fff' : (darkMode ? '#444' : '#374151'),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'none' }}>
                        {selected && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{eq.label}</div>
                        <div style={{ display: 'none' }}>{eq.desc}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: '16px', background: '#fef2f2', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#991b1b' }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '11px', borderRadius: '10px',
                border: `0.5px solid ${darkMode ? '#1a1a1a' : '#e5e7eb'}`, background: darkMode ? '#111111' : '#fff',
                fontSize: '14px', color: darkMode ? '#444444' : '#374151', cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < totalSteps ? setStep(s => s + 1) : handleFinish()}
            disabled={!canProceed() || saving}
            style={{
              flex: 2, padding: '15px', borderRadius: '12px',
              border: 'none',
              background: canProceed() && !saving ? '#1D9E75' : '#9FE1CB',
              color: '#fff', fontSize: '16px', fontWeight: 800,
              cursor: canProceed() && !saving ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Saving...' : step < totalSteps ? 'Continue' : 'Finish setup'}
          </button>
        </div>
      </div>
    </div>
  )
}

const optionStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', cursor: 'pointer',
  transition: 'all 0.15s',
}
const sliderLabelStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  fontSize: '11px', fontWeight: 500, color: '#444',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  marginBottom: '10px',
}
