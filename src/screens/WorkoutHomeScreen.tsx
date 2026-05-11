import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onStartWorkout: () => void
  onStartRoutine: (templateId: string) => void
  onNewRoutine: () => void
  onExploreRoutines: () => void
  onHome: () => void
  onOpenProfile: () => void
  refreshKey?: number
}

interface SavedRoutine {
  id: string
  name: string
  split_type: string
  workout_templates: {
    id: string
    name: string
    day_type: string
    sort_order: number
  }[]
}


export default function WorkoutHomeScreen({ onStartWorkout, onStartRoutine, onNewRoutine, onExploreRoutines, onHome, onOpenProfile, refreshKey }: Props) {
  const { user } = useAuth()
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([])
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  async function loadSavedRoutines() {
    if (!user) return
    const { data } = await supabase
      .from('programs')
      .select('id, name, split_type, created_at, workout_templates(id, name, day_type, sort_order)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) {
      console.log('savedRoutines loaded:', JSON.stringify(data, null, 2))
      setSavedRoutines(data as SavedRoutine[])
    }
  }

  useEffect(() => { loadSavedRoutines() }, [user, refreshKey])

  async function deleteRoutine(programId: string) {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)
      .eq('user_id', user!.id)

    if (!error) {
      setSavedRoutines(prev => prev.filter(r => r.id !== programId))
      setConfirmDelete(null)
    } else {
      console.log('Delete error:', error.message)
      alert('Delete failed: ' + error.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>Workout</div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        {/* Start Empty Workout */}
        <div
          onClick={onStartWorkout}
          style={{
            background: '#1c1c1e',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '0.5px solid #2a2a2a',
            cursor: 'pointer',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2a2a2a', color: '#ffffff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Start Empty Workout</span>
        </div>

        {/* Routines label + grid */}
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}>Routines</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            onClick={onNewRoutine}
            style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '14px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '28px' }}>📋</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>New Routine</span>
          </div>
          <div
            onClick={onExploreRoutines}
            style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '14px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '28px' }}>🔍</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Explore Routines</span>
          </div>
        </div>

        {/* Saved routines */}
        {savedRoutines.map(routine => {
          const days = (routine.workout_templates ?? [])
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)

          console.log('routine:', routine.name, 'templates:', routine.workout_templates)
          const isExpanded = expandedRoutine === routine.id
          const dayCount = days.length

          return (
            <div key={routine.id}>
              {/* Program header */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', cursor: 'pointer' }}
                onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
              >
                <span style={{ fontSize: '13px', color: '#888', lineHeight: 1, transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                <span style={{ fontSize: '14px', color: '#888', flex: 1 }}>{routine.name} <span style={{ color: '#555' }}>({dayCount})</span></span>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(confirmDelete === routine.id ? null : routine.id) }}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                >
                  ···
                </button>
              </div>

              {confirmDelete === routine.id && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    style={{ flex: 1, padding: '8px', background: '#2a0f0f', border: '0.5px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{ flex: 1, padding: '8px', background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '8px', color: '#888', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Expanded: one card per workout_template day */}
              {isExpanded && days.map((day: any) => (
                <div key={day.id} style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    {day.name}
                  </div>
                  <button
                    onClick={() => { console.log('Starting template id:', day.id, 'day name:', day.name); onStartRoutine(day.id) }}
                    style={{ width: '100%', padding: '12px', marginTop: '10px', background: '#1D9E75', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Start Routine
                  </button>
                </div>
              ))}
            </div>
          )
        })}

      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0d0d0d', borderTop: '0.5px solid #1a1a1a', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 20px', zIndex: 50 }}>
        <button onClick={onHome} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: '#555555' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Home</span>
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: '#1D9E75' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M8 4h-4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4M8 18h-4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h4M16 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4M16 18h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-4M8 12h8"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Workout</span>
        </button>
        <button onClick={onOpenProfile} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: '#555555' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Profile</span>
        </button>
      </div>
    </div>
  )
}
