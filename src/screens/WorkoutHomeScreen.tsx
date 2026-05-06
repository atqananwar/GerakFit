import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onStartWorkout: () => void
  onStartRoutine: (routineId: string) => void
  onNewRoutine: () => void
  onExploreRoutines: () => void
  onHome: () => void
  onOpenProfile: () => void
}

interface SavedRoutine {
  id: string
  name: string
  created_at: string
  template_exercises: {
    id: string
    sort_order: number
    exercises: { name: string; primary_muscle: string }[]
  }[]
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'workout', label: 'Workout' },
  { id: 'profile', label: 'Profile' },
]

export default function WorkoutHomeScreen({ onStartWorkout, onStartRoutine, onNewRoutine, onExploreRoutines, onHome, onOpenProfile }: Props) {
  const { user } = useAuth()
  const [darkMode] = useState(() => localStorage.getItem('gerakfit-dark') !== 'false')
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([])
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0d0d0d' : '#f9fafb'
  }, [darkMode])

  async function loadSavedRoutines() {
    if (!user) return
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .eq('user_id', user.id)
    if (!programs || programs.length === 0) return
    const programIds = programs.map(p => p.id)
    const { data } = await supabase
      .from('workout_templates')
      .select('id, name, created_at, template_exercises(id, sort_order, exercises(name, primary_muscle))')
      .in('program_id', programIds)
      .order('created_at', { ascending: false })
    if (data) setSavedRoutines(data as SavedRoutine[])
  }

  useEffect(() => { loadSavedRoutines() }, [user])

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#0d0d0d' : '#f9fafb', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>

      {/* v2 */}
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
            width: '100%',
            border: '0.5px solid #2a2a2a',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2a2a2a', color: '#ffffff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Start Empty Workout</span>
        </div>

        {/* Routines label */}
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}>Routines</div>

        {/* Grid buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            onClick={onNewRoutine}
            style={{
              background: '#1c1c1e',
              border: '0.5px solid #2a2a2a',
              borderRadius: '14px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '28px' }}>📋</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>New Routine</span>
          </div>
          <div
            onClick={onExploreRoutines}
            style={{
              background: '#1c1c1e',
              border: '0.5px solid #2a2a2a',
              borderRadius: '14px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '28px' }}>🔍</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Explore Routines</span>
          </div>
        </div>

        {/* Saved routines */}
        {savedRoutines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {savedRoutines.map(routine => {
              const exercises = routine.template_exercises
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(te => te.exercises[0])
                .filter(Boolean) as { name: string; primary_muscle: string }[]
              const preview = exercises.slice(0, 3).map(e => e.name).join(' · ')
              const isExpanded = expandedRoutine === routine.id

              return (
                <div
                  key={routine.id}
                  style={{ background: '#1c1c1e', border: '0.5px solid #2a2a2a', borderRadius: '14px', padding: '16px', marginBottom: '8px' }}
                >
                  <div
                    onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>{routine.name}</div>
                      <span style={{ fontSize: '12px', color: '#666666' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    {!isExpanded && exercises.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#888888', marginTop: '6px' }}>{preview}{exercises.length > 3 ? ` · +${exercises.length - 3} more` : ''}</div>
                    )}
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '10px' }}>
                      {exercises.map((ex, i) => (
                        <div
                          key={i}
                          style={{ fontSize: '13px', color: '#cccccc', padding: '6px 0', borderBottom: '0.5px solid #1a1a1a' }}
                        >
                          {ex.name}
                        </div>
                      ))}
                      <button
                        onClick={() => onStartRoutine(routine.id)}
                        style={{ width: '100%', background: '#1D9E75', border: 'none', color: '#ffffff', fontSize: '15px', fontWeight: 700, padding: '14px', borderRadius: '12px', marginTop: '12px', cursor: 'pointer' }}
                      >
                        Start Routine
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1c1c1e', borderTop: '0.5px solid #2a2a2a', display: 'flex', justifyContent: 'space-around', padding: '0 0 16px', zIndex: 100 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'home') onHome()
              else if (item.id === 'profile') onOpenProfile()
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              borderTop: item.id === 'workout' ? '2px solid #378ADD' : '2px solid transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '10px 20px 4px',
              color: item.id === 'workout' ? '#378ADD' : '#666666',
              fontSize: '12px',
              fontWeight: item.id === 'workout' ? 600 : 400,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
